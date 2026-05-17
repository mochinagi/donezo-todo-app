"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Priority = "low" | "medium" | "high";

export interface Todo {
    id: string;
    text: string;
    normalized: string;
    completed: boolean;
    completedAt: number | null;
    archived: boolean;
    priority: Priority;
    pinned: boolean;
    order: number;
    dueDate: number | null;
    createdAt: number;
    updatedAt: number;
}

export type FilterType =
    | "tasks"
    | "active"
    | "completed"
    | "archived";

type TodoPatch = Partial<Todo>;

type RemovedTodo = {
    todo: Todo;
    index: number;
};

type BulkHistoryItem = {
    id: string;
    before: TodoPatch;
    after: TodoPatch;
};

type HistoryAction =
    | {
        type: "add";
        todo: Todo;
    }
    | {
        type: "delete";
        removed: RemovedTodo[];
    }
    | {
        type: "update";
        id: string;
        before: TodoPatch;
        after: TodoPatch;
    }
    | {
        type: "bulk";
        items: BulkHistoryItem[];
    };

type TodoStore = {
    todos: Todo[];

    search: string;
    searchNormalized: string;

    activeCategory: FilterType;

    hydrated: boolean;

    undoStack: HistoryAction[];
    redoStack: HistoryAction[];

    addTodo: (text: string) => void;

    updateTodoText: (
        id: string,
        text: string
    ) => void;

    toggleTodo: (id: string) => void;

    toggleMany: (
        ids: string[],
        completed: boolean
    ) => void;

    togglePinned: (id: string) => void;

    archiveMany: (
        ids: string[],
        archived: boolean
    ) => void;

    setPriority: (
        id: string,
        priority: Priority
    ) => void;

    setDueDate: (
        id: string,
        dueDate: number | null
    ) => void;

    reorderTodos: (
        activeId: string,
        overId: string
    ) => void;

    deleteTodo: (id: string) => void;

    deleteMany: (ids: string[]) => void;

    clearCompleted: () => void;

    autoArchiveCompleted: () => void;

    undo: () => void;

    redo: () => void;

    setSearch: (value: string) => void;

    setActiveCategory: (
        value: FilterType
    ) => void;

    setHydrated: (value: boolean) => void;
};

const HISTORY_LIMIT = 50;

const priorityWeight: Record<
    Priority,
    number
> = {
    high: 3,
    medium: 2,
    low: 1,
};

const normalizeText = (value: string) =>
    value
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

const reorderIndexes = (todos: Todo[]) =>
    todos.map((todo, index) => ({
        ...todo,
        order: index,
    }));

const isOverdue = (
    todo: Todo,
    now: number
) =>
    Boolean(
        todo.dueDate &&
        !todo.completed &&
        !todo.archived &&
        todo.dueDate < now
    );

const sortTodos = (
    todos: Todo[],
    now: number
) =>
    [...todos].sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return Number(b.pinned) - Number(a.pinned);
        }

        const overdueA = isOverdue(a, now);
        const overdueB = isOverdue(b, now);

        if (overdueA !== overdueB) {
            return Number(overdueB) - Number(overdueA);
        }

        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        if (a.priority !== b.priority) {
            return (
                priorityWeight[b.priority] -
                priorityWeight[a.priority]
            );
        }

        if (a.dueDate && b.dueDate) {
            return a.dueDate - b.dueDate;
        }

        return a.order - b.order;
    });

const pushHistory = (
    state: TodoStore,
    action: HistoryAction
) => ({
    undoStack: [
        ...state.undoStack,
        action,
    ].slice(-HISTORY_LIMIT),

    redoStack: [],
});

const createBulkHistory = (
    previous: Map<string, Todo>,
    next: Map<string, Todo>
) => {
    const items: BulkHistoryItem[] = [];

    next.forEach((updated, id) => {
        const current = previous.get(id);

        if (!current) {
            return;
        }

        const before: TodoPatch = {};
        const after: TodoPatch = {};

        (
            Object.keys(updated) as (keyof Todo)[]
        ).forEach(key => {
            if (current[key] !== updated[key]) {
                before[key] =
                    current[key] as never;

                after[key] =
                    updated[key] as never;
            }
        });

        if (Object.keys(before).length) {
            items.push({
                id,
                before,
                after,
            });
        }
    });

    return items;
};

const applyHistory = (
    todos: Todo[],
    action: HistoryAction,
    mode: "undo" | "redo"
) => {
    switch (action.type) {
        case "add":
            return mode === "undo"
                ? todos.filter(
                    todo =>
                        todo.id !== action.todo.id
                )
                : reorderIndexes([
                    action.todo,
                    ...todos,
                ]);

        case "delete":
            if (mode === "undo") {
                const restored = [...todos];

                action.removed
                    .sort(
                        (a, b) =>
                            a.index - b.index
                    )
                    .forEach(item => {
                        restored.splice(
                            item.index,
                            0,
                            item.todo
                        );
                    });

                return reorderIndexes(restored);
            }

            return reorderIndexes(
                todos.filter(
                    todo =>
                        !action.removed.some(
                            item =>
                                item.todo.id ===
                                todo.id
                        )
                )
            );

        case "update":
            return todos.map(todo => {
                if (todo.id !== action.id) {
                    return todo;
                }

                return {
                    ...todo,
                    ...(mode === "undo"
                        ? action.before
                        : action.after),
                };
            });

        case "bulk": {
            const map = new Map(
                action.items.map(item => [
                    item.id,
                    item,
                ])
            );

            return todos.map(todo => {
                const item = map.get(todo.id);

                if (!item) {
                    return todo;
                }

                return {
                    ...todo,
                    ...(mode === "undo"
                        ? item.before
                        : item.after),
                };
            });
        }

        default:
            return todos;
    }
};

export const useTodoStore =
    create<TodoStore>()(
        persist(
            (set, get) => ({
                todos: [],

                search: "",
                searchNormalized: "",

                activeCategory: "tasks",

                hydrated: false,

                undoStack: [],
                redoStack: [],

                addTodo: text =>
                    set(state => {
                        const value =
                            text.trim();

                        if (!value) {
                            return state;
                        }

                        const normalized =
                            normalizeText(value);

                        const duplicated =
                            state.todos.some(
                                todo =>
                                    todo.normalized ===
                                    normalized
                            );

                        if (duplicated) {
                            return state;
                        }

                        const now = Date.now();

                        const todo: Todo = {
                            id: crypto.randomUUID(),
                            text: value,
                            normalized,
                            completed: false,
                            completedAt: null,
                            archived: false,
                            priority: "medium",
                            pinned: false,
                            order: 0,
                            dueDate: null,
                            createdAt: now,
                            updatedAt: now,
                        };

                        const todos =
                            reorderIndexes([
                                todo,
                                ...state.todos,
                            ]);

                        return {
                            ...state,
                            todos,

                            ...pushHistory(
                                state,
                                {
                                    type: "add",
                                    todo,
                                }
                            ),
                        };
                    }),

                updateTodoText: (
                    id,
                    text
                ) =>
                    set(state => {
                        const value =
                            text.trim();

                        if (!value) {
                            return state;
                        }

                        const normalized =
                            normalizeText(value);

                        const target =
                            state.todos.find(
                                todo =>
                                    todo.id === id
                            );

                        if (!target) {
                            return state;
                        }

                        if (
                            target.normalized ===
                            normalized
                        ) {
                            return state;
                        }

                        const duplicated =
                            state.todos.some(
                                todo =>
                                    todo.id !==
                                    id &&
                                    todo.normalized ===
                                    normalized
                            );

                        if (duplicated) {
                            return state;
                        }

                        const updated = {
                            ...target,
                            text: value,
                            normalized,
                            updatedAt:
                                Date.now(),
                        };

                        const todos =
                            state.todos.map(
                                todo =>
                                    todo.id ===
                                        id
                                        ? updated
                                        : todo
                            );

                        return {
                            ...state,
                            todos,

                            ...pushHistory(
                                state,
                                {
                                    type: "update",
                                    id,

                                    before: {
                                        text: target.text,
                                        normalized:
                                            target.normalized,
                                    },

                                    after: {
                                        text: updated.text,
                                        normalized:
                                            updated.normalized,
                                    },
                                }
                            ),
                        };
                    }),

                toggleTodo: id =>
                    set(state => {
                        const previous =
                            new Map<
                                string,
                                Todo
                            >();

                        const updated =
                            new Map<
                                string,
                                Todo
                            >();

                        const todos =
                            state.todos.map(
                                todo => {
                                    if (
                                        todo.id !==
                                        id
                                    ) {
                                        return todo;
                                    }

                                    previous.set(
                                        todo.id,
                                        todo
                                    );

                                    const completed =
                                        !todo.completed;

                                    const next = {
                                        ...todo,
                                        completed,
                                        completedAt:
                                            completed
                                                ? Date.now()
                                                : null,
                                        updatedAt:
                                            Date.now(),
                                    };

                                    updated.set(
                                        todo.id,
                                        next
                                    );

                                    return next;
                                }
                            );

                        const items =
                            createBulkHistory(
                                previous,
                                updated
                            );

                        return {
                            ...state,
                            todos,

                            ...pushHistory(
                                state,
                                {
                                    type: "bulk",
                                    items,
                                }
                            ),
                        };
                    }),

                toggleMany: (
                    ids,
                    completed
                ) =>
                    set(state => {
                        const idSet =
                            new Set(ids);

                        const previous =
                            new Map<
                                string,
                                Todo
                            >();

                        const updated =
                            new Map<
                                string,
                                Todo
                            >();

                        const todos =
                            state.todos.map(
                                todo => {
                                    if (
                                        !idSet.has(
                                            todo.id
                                        )
                                    ) {
                                        return todo;
                                    }

                                    previous.set(
                                        todo.id,
                                        todo
                                    );

                                    const next = {
                                        ...todo,
                                        completed,
                                        completedAt:
                                            completed
                                                ? Date.now()
                                                : null,
                                        updatedAt:
                                            Date.now(),
                                    };

                                    updated.set(
                                        todo.id,
                                        next
                                    );

                                    return next;
                                }
                            );

                        const items =
                            createBulkHistory(
                                previous,
                                updated
                            );

                        if (!items.length) {
                            return state;
                        }

                        return {
                            ...state,
                            todos,

                            ...pushHistory(
                                state,
                                {
                                    type: "bulk",
                                    items,
                                }
                            ),
                        };
                    }),

                togglePinned: id =>
                    set(state => {
                        const target =
                            state.todos.find(
                                todo =>
                                    todo.id === id
                            );

                        if (!target) {
                            return state;
                        }

                        const updated = {
                            ...target,
                            pinned:
                                !target.pinned,
                            updatedAt:
                                Date.now(),
                        };

                        return {
                            ...state,

                            todos:
                                state.todos.map(
                                    todo =>
                                        todo.id ===
                                            id
                                            ? updated
                                            : todo
                                ),

                            ...pushHistory(
                                state,
                                {
                                    type: "update",
                                    id,

                                    before: {
                                        pinned:
                                            target.pinned,
                                    },

                                    after: {
                                        pinned:
                                            updated.pinned,
                                    },
                                }
                            ),
                        };
                    }),

                archiveMany: (
                    ids,
                    archived
                ) =>
                    set(state => {
                        const idSet =
                            new Set(ids);

                        const previous =
                            new Map<
                                string,
                                Todo
                            >();

                        const updated =
                            new Map<
                                string,
                                Todo
                            >();

                        const todos =
                            state.todos.map(
                                todo => {
                                    if (
                                        !idSet.has(
                                            todo.id
                                        )
                                    ) {
                                        return todo;
                                    }

                                    previous.set(
                                        todo.id,
                                        todo
                                    );

                                    const next = {
                                        ...todo,
                                        archived,
                                        updatedAt:
                                            Date.now(),
                                    };

                                    updated.set(
                                        todo.id,
                                        next
                                    );

                                    return next;
                                }
                            );

                        const items =
                            createBulkHistory(
                                previous,
                                updated
                            );

                        return {
                            ...state,
                            todos,

                            ...pushHistory(
                                state,
                                {
                                    type: "bulk",
                                    items,
                                }
                            ),
                        };
                    }),

                setPriority: (
                    id,
                    priority
                ) =>
                    set(state => {
                        const target =
                            state.todos.find(
                                todo =>
                                    todo.id === id
                            );

                        if (
                            !target ||
                            target.priority ===
                            priority
                        ) {
                            return state;
                        }

                        const updated = {
                            ...target,
                            priority,
                            updatedAt:
                                Date.now(),
                        };

                        return {
                            ...state,

                            todos:
                                state.todos.map(
                                    todo =>
                                        todo.id ===
                                            id
                                            ? updated
                                            : todo
                                ),

                            ...pushHistory(
                                state,
                                {
                                    type: "update",
                                    id,

                                    before: {
                                        priority:
                                            target.priority,
                                    },

                                    after: {
                                        priority,
                                    },
                                }
                            ),
                        };
                    }),

                setDueDate: (
                    id,
                    dueDate
                ) =>
                    set(state => {
                        const target =
                            state.todos.find(
                                todo =>
                                    todo.id === id
                            );

                        if (!target) {
                            return state;
                        }

                        const updated = {
                            ...target,
                            dueDate,
                            updatedAt:
                                Date.now(),
                        };

                        return {
                            ...state,

                            todos:
                                state.todos.map(
                                    todo =>
                                        todo.id ===
                                            id
                                            ? updated
                                            : todo
                                ),

                            ...pushHistory(
                                state,
                                {
                                    type: "update",
                                    id,

                                    before: {
                                        dueDate:
                                            target.dueDate,
                                    },

                                    after: {
                                        dueDate,
                                    },
                                }
                            ),
                        };
                    }),

                reorderTodos: (
                    activeId,
                    overId
                ) =>
                    set(state => {
                        const from =
                            state.todos.findIndex(
                                todo =>
                                    todo.id ===
                                    activeId
                            );

                        const to =
                            state.todos.findIndex(
                                todo =>
                                    todo.id ===
                                    overId
                            );

                        if (
                            from === -1 ||
                            to === -1 ||
                            from === to
                        ) {
                            return state;
                        }

                        const copied = [
                            ...state.todos,
                        ];

                        const previous =
                            new Map(
                                copied.map(
                                    todo => [
                                        todo.id,
                                        todo,
                                    ]
                                )
                            );

                        const [moved] =
                            copied.splice(
                                from,
                                1
                            );

                        copied.splice(
                            to,
                            0,
                            moved
                        );

                        const todos =
                            reorderIndexes(
                                copied
                            );

                        const updated =
                            new Map(
                                todos.map(
                                    todo => [
                                        todo.id,
                                        todo,
                                    ]
                                )
                            );

                        return {
                            ...state,
                            todos,

                            ...pushHistory(
                                state,
                                {
                                    type: "bulk",
                                    items:
                                        createBulkHistory(
                                            previous,
                                            updated
                                        ),
                                }
                            ),
                        };
                    }),

                deleteTodo: id =>
                    get().deleteMany([id]),

                deleteMany: ids =>
                    set(state => {
                        const idSet =
                            new Set(ids);

                        const removed: RemovedTodo[] =
                            [];

                        state.todos.forEach(
                            (
                                todo,
                                index
                            ) => {
                                if (
                                    idSet.has(
                                        todo.id
                                    )
                                ) {
                                    removed.push(
                                        {
                                            todo,
                                            index,
                                        }
                                    );
                                }
                            }
                        );

                        if (!removed.length) {
                            return state;
                        }

                        return {
                            ...state,

                            todos:
                                reorderIndexes(
                                    state.todos.filter(
                                        todo =>
                                            !idSet.has(
                                                todo.id
                                            )
                                    )
                                ),

                            ...pushHistory(
                                state,
                                {
                                    type: "delete",
                                    removed,
                                }
                            ),
                        };
                    }),

                clearCompleted: () => {
                    const ids =
                        get()
                            .todos.filter(
                                todo =>
                                    todo.completed
                            )
                            .map(
                                todo =>
                                    todo.id
                            );

                    get().deleteMany(ids);
                },

                autoArchiveCompleted:
                    () =>
                        set(state => {
                            const now =
                                Date.now();

                            const threshold =
                                1000 *
                                60 *
                                60 *
                                24 *
                                7;

                            const previous =
                                new Map<
                                    string,
                                    Todo
                                >();

                            const updated =
                                new Map<
                                    string,
                                    Todo
                                >();

                            const todos =
                                state.todos.map(
                                    todo => {
                                        if (
                                            !todo.completed ||
                                            todo.archived ||
                                            !todo.completedAt
                                        ) {
                                            return todo;
                                        }

                                        if (
                                            now -
                                            todo.completedAt <
                                            threshold
                                        ) {
                                            return todo;
                                        }

                                        previous.set(
                                            todo.id,
                                            todo
                                        );

                                        const next =
                                        {
                                            ...todo,
                                            archived:
                                                true,
                                            updatedAt:
                                                now,
                                        };

                                        updated.set(
                                            todo.id,
                                            next
                                        );

                                        return next;
                                    }
                                );

                            const items =
                                createBulkHistory(
                                    previous,
                                    updated
                                );

                            if (!items.length) {
                                return state;
                            }

                            return {
                                ...state,
                                todos,

                                ...pushHistory(
                                    state,
                                    {
                                        type: "bulk",
                                        items,
                                    }
                                ),
                            };
                        }),

                undo: () =>
                    set(state => {
                        const action =
                            state.undoStack.at(
                                -1
                            );

                        if (!action) {
                            return state;
                        }

                        return {
                            ...state,

                            todos:
                                applyHistory(
                                    state.todos,
                                    action,
                                    "undo"
                                ),

                            undoStack:
                                state.undoStack.slice(
                                    0,
                                    -1
                                ),

                            redoStack: [
                                ...state.redoStack,
                                action,
                            ].slice(
                                -HISTORY_LIMIT
                            ),
                        };
                    }),

                redo: () =>
                    set(state => {
                        const action =
                            state.redoStack.at(
                                -1
                            );

                        if (!action) {
                            return state;
                        }

                        return {
                            ...state,

                            todos:
                                applyHistory(
                                    state.todos,
                                    action,
                                    "redo"
                                ),

                            redoStack:
                                state.redoStack.slice(
                                    0,
                                    -1
                                ),

                            undoStack: [
                                ...state.undoStack,
                                action,
                            ].slice(
                                -HISTORY_LIMIT
                            ),
                        };
                    }),

                setSearch: value =>
                    set({
                        search: value,
                        searchNormalized:
                            normalizeText(
                                value
                            ),
                    }),

                setActiveCategory:
                    value =>
                        set({
                            activeCategory:
                                value,
                        }),

                setHydrated: value =>
                    set({
                        hydrated: value,
                    }),
            }),

            {
                name: "todo-storage",

                version: 31,

                storage:
                    createJSONStorage(
                        () =>
                            localStorage
                    ),

                migrate:
                    persistedState => {
                        const persisted =
                            persistedState as Partial<TodoStore>;

                        const todos =
                            (
                                persisted.todos ??
                                []
                            )
                                .filter(
                                    todo =>
                                        todo &&
                                        typeof todo.text ===
                                        "string"
                                )
                                .map(
                                    todo => ({
                                        ...todo,

                                        normalized:
                                            todo.normalized ??
                                            normalizeText(
                                                todo.text
                                            ),

                                        archived:
                                            todo.archived ??
                                            false,

                                        pinned:
                                            todo.pinned ??
                                            false,

                                        priority:
                                            todo.priority ??
                                            "medium",

                                        completedAt:
                                            todo.completedAt ??
                                            null,

                                        dueDate:
                                            todo.dueDate ??
                                            null,
                                    })
                                );

                        return {
                            ...persisted,
                            todos,
                        };
                    },

                partialize: state => ({
                    todos: state.todos,
                    activeCategory:
                        state.activeCategory,
                }),

                onRehydrateStorage:
                    () => state => {
                        state?.setHydrated(
                            true
                        );

                        state?.autoArchiveCompleted();
                    },
            }
        )
    );

export const useFilteredTodos = () =>
    useTodoStore(state => {
        const now = Date.now();

        return sortTodos(
            state.todos.filter(todo => {
                if (
                    state.activeCategory !==
                    "archived" &&
                    todo.archived
                ) {
                    return false;
                }

                if (
                    !todo.normalized.includes(
                        state.searchNormalized
                    )
                ) {
                    return false;
                }

                switch (
                state.activeCategory
                ) {
                    case "active":
                        return !todo.completed;

                    case "completed":
                        return todo.completed;

                    case "archived":
                        return todo.archived;

                    default:
                        return true;
                }
            }),
            now
        );
    });

export const useTodoStats = () =>
    useTodoStore(state => {
        const now = Date.now();

        let completed = 0;
        let archived = 0;
        let overdue = 0;

        for (const todo of state.todos) {
            if (todo.completed) {
                completed++;
            }

            if (todo.archived) {
                archived++;
            }

            if (isOverdue(todo, now)) {
                overdue++;
            }
        }

        return {
            total: state.todos.length,

            active:
                state.todos.length -
                completed,

            completed,

            archived,

            overdue,
        };
    });