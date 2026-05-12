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

type RemovedTodo = {
    todo: Todo;
    index: number;
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
        before: Partial<Todo>;
        after: Partial<Todo>;
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
        from: number,
        to: number
    ) => void;

    deleteTodo: (id: string) => void;

    deleteMany: (ids: string[]) => void;

    clearCompleted: () => void;

    undo: () => void;
    redo: () => void;

    setSearch: (value: string) => void;

    setActiveCategory: (
        value: FilterType
    ) => void;

    setHydrated: (
        value: boolean
    ) => void;
};

const HISTORY_LIMIT = 50;

const now = () => Date.now();

const normalizeText = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

const priorityWeight: Record<
    Priority,
    number
> = {
    high: 3,
    medium: 2,
    low: 1,
};

const isOverdue = (todo: Todo) =>
    !!todo.dueDate &&
    !todo.completed &&
    !todo.archived &&
    todo.dueDate < now();

const isStale = (todo: Todo) => {
    if (todo.completed || todo.archived) {
        return false;
    }

    return now() - todo.updatedAt > 1000 * 60 * 60 * 24 * 7;
};

const sortTodos = (todos: Todo[]) => {
    return [...todos].sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return Number(b.pinned) - Number(a.pinned);
        }

        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);

        if (aOverdue !== bOverdue) {
            return Number(bOverdue) - Number(aOverdue);
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
};

const limitHistory = (
    stack: HistoryAction[]
) => stack.slice(-HISTORY_LIMIT);

const touchTodo = (
    todo: Todo,
    patch: Partial<Todo>
): Todo => ({
    ...todo,
    ...patch,
    updatedAt: now(),
});

const reorderIndexes = (todos: Todo[]) =>
    todos.map((todo, index) => ({
        ...todo,
        order: index,
    }));

const createUpdateAction = (
    id: string,
    before: Partial<Todo>,
    after: Partial<Todo>
): HistoryAction => ({
    type: "update",
    id,
    before,
    after,
});

const applyState = (
    state: TodoStore,
    todos: Todo[],
    action?: HistoryAction
) => ({
    ...state,
    todos,
    undoStack: action
        ? limitHistory([
            ...state.undoStack,
            action,
        ])
        : state.undoStack,
    redoStack: action
        ? []
        : state.redoStack,
});

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
                        const value = text.trim();

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

                        const timestamp = now();

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

                            createdAt: timestamp,
                            updatedAt: timestamp,
                        };

                        const next = reorderIndexes([
                            todo,
                            ...state.todos,
                        ]);

                        return applyState(
                            state,
                            next,
                            {
                                type: "add",
                                todo,
                            }
                        );
                    }),

                updateTodoText: (
                    id,
                    text
                ) =>
                    set(state => {
                        const value = text.trim();

                        if (!value) {
                            return state;
                        }

                        const normalized =
                            normalizeText(value);

                        const duplicated =
                            state.todos.some(
                                todo =>
                                    todo.id !== id &&
                                    todo.normalized ===
                                    normalized
                            );

                        if (duplicated) {
                            return state;
                        }

                        let before: Todo | null =
                            null;

                        let after: Todo | null =
                            null;

                        const next = state.todos.map(
                            todo => {
                                if (todo.id !== id) {
                                    return todo;
                                }

                                before = todo;

                                after = touchTodo(todo, {
                                    text: value,
                                    normalized,
                                });

                                return after;
                            }
                        );

                        if (!before || !after) {
                            return state;
                        }

                        return applyState(
                            state,
                            next,
                            createUpdateAction(
                                id,
                                {
                                    text: before.text,
                                    normalized:
                                        before.normalized,
                                },
                                {
                                    text: after.text,
                                    normalized:
                                        after.normalized,
                                }
                            )
                        );
                    }),

                toggleTodo: id =>
                    set(state => {
                        let before: Todo | null =
                            null;

                        let after: Todo | null =
                            null;

                        const next = state.todos.map(
                            todo => {
                                if (todo.id !== id) {
                                    return todo;
                                }

                                before = todo;

                                after = touchTodo(todo, {
                                    completed:
                                        !todo.completed,
                                    completedAt:
                                        !todo.completed
                                            ? now()
                                            : null,
                                });

                                return after;
                            }
                        );

                        if (!before || !after) {
                            return state;
                        }

                        return applyState(
                            state,
                            next,
                            createUpdateAction(
                                id,
                                {
                                    completed:
                                        before.completed,
                                    completedAt:
                                        before.completedAt,
                                },
                                {
                                    completed:
                                        after.completed,
                                    completedAt:
                                        after.completedAt,
                                }
                            )
                        );
                    }),

                toggleMany: (
                    ids,
                    completed
                ) =>
                    set(state => {
                        const idSet = new Set(ids);

                        const next = state.todos.map(
                            todo => {
                                if (
                                    !idSet.has(todo.id)
                                ) {
                                    return todo;
                                }

                                return touchTodo(todo, {
                                    completed,
                                    completedAt:
                                        completed
                                            ? now()
                                            : null,
                                });
                            }
                        );

                        return {
                            ...state,
                            todos: next,
                        };
                    }),

                togglePinned: id =>
                    set(state => {
                        const next = state.todos.map(
                            todo => {
                                if (todo.id !== id) {
                                    return todo;
                                }

                                return touchTodo(todo, {
                                    pinned:
                                        !todo.pinned,
                                });
                            }
                        );

                        return {
                            ...state,
                            todos: next,
                        };
                    }),

                archiveMany: (
                    ids,
                    archived
                ) =>
                    set(state => {
                        const idSet = new Set(ids);

                        const next = state.todos.map(
                            todo => {
                                if (
                                    !idSet.has(todo.id)
                                ) {
                                    return todo;
                                }

                                return touchTodo(todo, {
                                    archived,
                                });
                            }
                        );

                        return {
                            ...state,
                            todos: next,
                        };
                    }),

                setPriority: (
                    id,
                    priority
                ) =>
                    set(state => {
                        const next = state.todos.map(
                            todo => {
                                if (todo.id !== id) {
                                    return todo;
                                }

                                return touchTodo(todo, {
                                    priority,
                                });
                            }
                        );

                        return {
                            ...state,
                            todos: next,
                        };
                    }),

                setDueDate: (
                    id,
                    dueDate
                ) =>
                    set(state => {
                        const next = state.todos.map(
                            todo => {
                                if (todo.id !== id) {
                                    return todo;
                                }

                                return touchTodo(todo, {
                                    dueDate,
                                });
                            }
                        );

                        return {
                            ...state,
                            todos: next,
                        };
                    }),

                reorderTodos: (
                    from,
                    to
                ) =>
                    set(state => {
                        if (from === to) {
                            return state;
                        }

                        const todos = [
                            ...state.todos,
                        ];

                        if (
                            from < 0 ||
                            to < 0 ||
                            from >= todos.length ||
                            to >= todos.length
                        ) {
                            return state;
                        }

                        const [moved] =
                            todos.splice(from, 1);

                        todos.splice(to, 0, moved);

                        return {
                            ...state,
                            todos:
                                reorderIndexes(
                                    todos
                                ),
                        };
                    }),

                deleteTodo: id => {
                    get().deleteMany([id]);
                },

                deleteMany: ids =>
                    set(state => {
                        const idSet = new Set(ids);

                        const removed: RemovedTodo[] =
                            [];

                        state.todos.forEach(
                            (todo, index) => {
                                if (
                                    idSet.has(todo.id)
                                ) {
                                    removed.push({
                                        todo,
                                        index,
                                    });
                                }
                            }
                        );

                        if (!removed.length) {
                            return state;
                        }

                        const next =
                            reorderIndexes(
                                state.todos.filter(
                                    todo =>
                                        !idSet.has(
                                            todo.id
                                        )
                                )
                            );

                        return applyState(
                            state,
                            next,
                            {
                                type: "delete",
                                removed,
                            }
                        );
                    }),

                clearCompleted: () => {
                    const ids = get()
                        .todos.filter(
                            todo =>
                                todo.completed
                        )
                        .map(todo => todo.id);

                    get().deleteMany(ids);
                },

                undo: () =>
                    set(state => {
                        const action =
                            state.undoStack.at(-1);

                        if (!action) {
                            return state;
                        }

                        let next =
                            state.todos;

                        switch (
                        action.type
                        ) {
                            case "add":
                                next =
                                    state.todos.filter(
                                        todo =>
                                            todo.id !==
                                            action.todo.id
                                    );
                                break;

                            case "delete": {
                                const restored = [
                                    ...state.todos,
                                ];

                                action.removed
                                    .sort(
                                        (a, b) =>
                                            a.index -
                                            b.index
                                    )
                                    .forEach(item => {
                                        restored.splice(
                                            item.index,
                                            0,
                                            item.todo
                                        );
                                    });

                                next =
                                    reorderIndexes(
                                        restored
                                    );

                                break;
                            }

                            case "update":
                                next =
                                    state.todos.map(
                                        todo => {
                                            if (
                                                todo.id !==
                                                action.id
                                            ) {
                                                return todo;
                                            }

                                            return {
                                                ...todo,
                                                ...action.before,
                                            };
                                        }
                                    );

                                break;
                        }

                        return {
                            ...state,
                            todos: next,

                            undoStack:
                                state.undoStack.slice(
                                    0,
                                    -1
                                ),

                            redoStack:
                                limitHistory([
                                    ...state.redoStack,
                                    action,
                                ]),
                        };
                    }),

                redo: () =>
                    set(state => {
                        const action =
                            state.redoStack.at(-1);

                        if (!action) {
                            return state;
                        }

                        let next =
                            state.todos;

                        switch (
                        action.type
                        ) {
                            case "add":
                                next =
                                    reorderIndexes([
                                        action.todo,
                                        ...state.todos,
                                    ]);
                                break;

                            case "delete": {
                                const ids =
                                    new Set(
                                        action.removed.map(
                                            item =>
                                                item.todo.id
                                        )
                                    );

                                next =
                                    reorderIndexes(
                                        state.todos.filter(
                                            todo =>
                                                !ids.has(
                                                    todo.id
                                                )
                                        )
                                    );

                                break;
                            }

                            case "update":
                                next =
                                    state.todos.map(
                                        todo => {
                                            if (
                                                todo.id !==
                                                action.id
                                            ) {
                                                return todo;
                                            }

                                            return {
                                                ...todo,
                                                ...action.after,
                                            };
                                        }
                                    );

                                break;
                        }

                        return {
                            ...state,
                            todos: next,

                            redoStack:
                                state.redoStack.slice(
                                    0,
                                    -1
                                ),

                            undoStack:
                                limitHistory([
                                    ...state.undoStack,
                                    action,
                                ]),
                        };
                    }),

                setSearch: value =>
                    set({
                        search: value,
                        searchNormalized:
                            normalizeText(value),
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

                version: 27,

                storage:
                    createJSONStorage(
                        () => localStorage
                    ),

                migrate: persisted => {
                    return persisted as TodoStore;
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
                    },
            }
        )
    );

export const useFilteredTodos =
    () =>
        useTodoStore(state => {
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
                })
            );
        });

export const useTodoStats = () =>
    useTodoStore(state => {
        let completed = 0;
        let archived = 0;
        let overdue = 0;
        let stale = 0;

        for (const todo of state.todos) {
            if (todo.completed) {
                completed++;
            }

            if (todo.archived) {
                archived++;
            }

            if (isOverdue(todo)) {
                overdue++;
            }

            if (isStale(todo)) {
                stale++;
            }
        }

        return {
            total: state.todos.length,
            completed,
            active:
                state.todos.length -
                completed,
            archived,
            overdue,
            stale,
        };
    });