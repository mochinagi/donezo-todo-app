```ts
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
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: RemovedTodo[] }
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

    updateTodoText: (id: string, text: string) => void;

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

    setHydrated: (value: boolean) => void;
};

const HISTORY_LIMIT = 50;

const timestamp = () => Date.now();

const normalizeText = (value: string) =>
    value
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

const priorityWeight: Record<
    Priority,
    number
> = {
    high: 3,
    medium: 2,
    low: 1,
};

const isOverdue = (todo: Todo) =>
    Boolean(
        todo.dueDate &&
            !todo.completed &&
            !todo.archived &&
            todo.dueDate < timestamp()
    );

const isStale = (todo: Todo) =>
    !todo.completed &&
    !todo.archived &&
    timestamp() - todo.updatedAt >
        1000 * 60 * 60 * 24 * 7;

const sortTodos = (todos: Todo[]) =>
    [...todos].sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return Number(b.pinned) - Number(a.pinned);
        }

        const overdueA = isOverdue(a);
        const overdueB = isOverdue(b);

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

const withUpdatedAt = (
    todo: Todo,
    patch: TodoPatch
): Todo => ({
    ...todo,
    ...patch,
    updatedAt: timestamp(),
});

const reorderIndexes = (todos: Todo[]) =>
    todos.map((todo, index) => ({
        ...todo,
        order: index,
    }));

const trimHistory = (
    stack: HistoryAction[]
) => stack.slice(-HISTORY_LIMIT);

const createBulkHistory = (
    previousTodos: Map<string, Todo>,
    updatedTodos: Map<string, Todo>
): BulkHistoryItem[] => {
    const items: BulkHistoryItem[] = [];

    updatedTodos.forEach((updated, id) => {
        const previous = previousTodos.get(id);

        if (!previous) return;

        const before: TodoPatch = {};
        const after: TodoPatch = {};

        (Object.keys(updated) as (keyof Todo)[]).forEach(
            key => {
                if (previous[key] !== updated[key]) {
                    before[key] = previous[key] as never;
                    after[key] = updated[key] as never;
                }
            }
        );

        items.push({
            id,
            before,
            after,
        });
    });

    return items;
};

export const useTodoStore = create<TodoStore>()(
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

                    const now = timestamp();

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

                    const todos = reorderIndexes([
                        todo,
                        ...state.todos,
                    ]);

                    return {
                        ...state,

                        todos,

                        undoStack: trimHistory([
                            ...state.undoStack,
                            {
                                type: "add",
                                todo,
                            },
                        ]),

                        redoStack: [],
                    };
                }),

            updateTodoText: (id, text) =>
                set(state => {
                    const value = text.trim();

                    if (!value) {
                        return state;
                    }

                    const normalized =
                        normalizeText(value);

                    let previousTodo: Todo | null =
                        null;

                    let updatedTodo: Todo | null =
                        null;

                    const todos = state.todos.map(
                        todo => {
                            if (todo.id !== id) {
                                return todo;
                            }

                            previousTodo = todo;

                            updatedTodo =
                                withUpdatedAt(todo, {
                                    text: value,
                                    normalized,
                                });

                            return updatedTodo;
                        }
                    );

                    if (
                        !previousTodo ||
                        !updatedTodo
                    ) {
                        return state;
                    }

                    return {
                        ...state,

                        todos,

                        undoStack: trimHistory([
                            ...state.undoStack,
                            {
                                type: "update",

                                id,

                                before: {
                                    text: previousTodo.text,
                                    normalized:
                                        previousTodo.normalized,
                                },

                                after: {
                                    text: updatedTodo.text,
                                    normalized:
                                        updatedTodo.normalized,
                                },
                            },
                        ]),

                        redoStack: [],
                    };
                }),

            toggleTodo: id =>
                set(state => {
                    return get().toggleMany(
                        [id],
                        !state.todos.find(
                            todo => todo.id === id
                        )?.completed
                    );
                }),

            toggleMany: (
                ids,
                completed
            ) =>
                set(state => {
                    const affectedIds = new Set(ids);

                    const previousTodos = new Map<
                        string,
                        Todo
                    >();

                    const updatedTodos = new Map<
                        string,
                        Todo
                    >();

                    const todos = state.todos.map(
                        todo => {
                            if (
                                !affectedIds.has(todo.id)
                            ) {
                                return todo;
                            }

                            previousTodos.set(
                                todo.id,
                                todo
                            );

                            const updated =
                                withUpdatedAt(todo, {
                                    completed,
                                    completedAt:
                                        completed
                                            ? timestamp()
                                            : null,
                                });

                            updatedTodos.set(
                                todo.id,
                                updated
                            );

                            return updated;
                        }
                    );

                    return {
                        ...state,

                        todos,

                        undoStack: trimHistory([
                            ...state.undoStack,
                            {
                                type: "bulk",
                                items: createBulkHistory(
                                    previousTodos,
                                    updatedTodos
                                ),
                            },
                        ]),

                        redoStack: [],
                    };
                }),

            togglePinned: id =>
                set(state => {
                    const previous =
                        new Map<string, Todo>();

                    const updated =
                        new Map<string, Todo>();

                    const todos = state.todos.map(
                        todo => {
                            if (todo.id !== id) {
                                return todo;
                            }

                            previous.set(
                                todo.id,
                                todo
                            );

                            const next =
                                withUpdatedAt(todo, {
                                    pinned:
                                        !todo.pinned,
                                });

                            updated.set(
                                todo.id,
                                next
                            );

                            return next;
                        }
                    );

                    return {
                        ...state,

                        todos,

                        undoStack: trimHistory([
                            ...state.undoStack,
                            {
                                type: "bulk",
                                items: createBulkHistory(
                                    previous,
                                    updated
                                ),
                            },
                        ]),

                        redoStack: [],
                    };
                }),

            archiveMany: (
                ids,
                archived
            ) =>
                set(state => {
                    const affectedIds = new Set(ids);

                    const previous =
                        new Map<string, Todo>();

                    const updated =
                        new Map<string, Todo>();

                    const todos = state.todos.map(
                        todo => {
                            if (
                                !affectedIds.has(todo.id)
                            ) {
                                return todo;
                            }

                            previous.set(
                                todo.id,
                                todo
                            );

                            const next =
                                withUpdatedAt(todo, {
                                    archived,
                                });

                            updated.set(
                                todo.id,
                                next
                            );

                            return next;
                        }
                    );

                    return {
                        ...state,

                        todos,

                        undoStack: trimHistory([
                            ...state.undoStack,
                            {
                                type: "bulk",
                                items: createBulkHistory(
                                    previous,
                                    updated
                                ),
                            },
                        ]),

                        redoStack: [],
                    };
                }),

            setPriority: (
                id,
                priority
            ) =>
                set(state => {
                    const todos = state.todos.map(
                        todo =>
                            todo.id === id
                                ? withUpdatedAt(todo, {
                                      priority,
                                  })
                                : todo
                    );

                    return {
                        ...state,
                        todos,
                    };
                }),

            setDueDate: (
                id,
                dueDate
            ) =>
                set(state => {
                    const todos = state.todos.map(
                        todo =>
                            todo.id === id
                                ? withUpdatedAt(todo, {
                                      dueDate,
                                  })
                                : todo
                    );

                    return {
                        ...state,
                        todos,
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

                    const copied = [
                        ...state.todos,
                    ];

                    if (
                        from < 0 ||
                        to < 0 ||
                        from >= copied.length ||
                        to >= copied.length
                    ) {
                        return state;
                    }

                    const previous =
                        new Map(
                            copied.map(todo => [
                                todo.id,
                                todo,
                            ])
                        );

                    const [moved] =
                        copied.splice(from, 1);

                    copied.splice(to, 0, moved);

                    const todos =
                        reorderIndexes(copied);

                    const updated =
                        new Map(
                            todos.map(todo => [
                                todo.id,
                                todo,
                            ])
                        );

                    return {
                        ...state,

                        todos,

                        undoStack: trimHistory([
                            ...state.undoStack,
                            {
                                type: "bulk",
                                items: createBulkHistory(
                                    previous,
                                    updated
                                ),
                            },
                        ]),

                        redoStack: [],
                    };
                }),

            deleteTodo: id =>
                get().deleteMany([id]),

            deleteMany: ids =>
                set(state => {
                    const affectedIds = new Set(ids);

                    const removed: RemovedTodo[] =
                        [];

                    state.todos.forEach(
                        (todo, index) => {
                            if (
                                affectedIds.has(
                                    todo.id
                                )
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

                    const todos =
                        reorderIndexes(
                            state.todos.filter(
                                todo =>
                                    !affectedIds.has(
                                        todo.id
                                    )
                            )
                        );

                    return {
                        ...state,

                        todos,

                        undoStack: trimHistory([
                            ...state.undoStack,
                            {
                                type: "delete",
                                removed,
                            },
                        ]),

                        redoStack: [],
                    };
                }),

            clearCompleted: () => {
                const completedIds =
                    get()
                        .todos.filter(
                            todo => todo.completed
                        )
                        .map(todo => todo.id);

                get().deleteMany(completedIds);
            },

            undo: () =>
                set(state => {
                    const action =
                        state.undoStack.at(-1);

                    if (!action) {
                        return state;
                    }

                    let todos = [
                        ...state.todos,
                    ];

                    switch (action.type) {
                        case "add":
                            todos = todos.filter(
                                todo =>
                                    todo.id !==
                                    action.todo.id
                            );
                            break;

                        case "delete": {
                            const restored = [
                                ...todos,
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

                            todos =
                                reorderIndexes(
                                    restored
                                );

                            break;
                        }

                        case "update":
                            todos = todos.map(
                                todo =>
                                    todo.id ===
                                    action.id
                                        ? {
                                              ...todo,
                                              ...action.before,
                                          }
                                        : todo
                            );
                            break;

                        case "bulk": {
                            const historyMap =
                                new Map(
                                    action.items.map(
                                        item => [
                                            item.id,
                                            item,
                                        ]
                                    )
                                );

                            todos = todos.map(
                                todo => {
                                    const item =
                                        historyMap.get(
                                            todo.id
                                        );

                                    return item
                                        ? {
                                              ...todo,
                                              ...item.before,
                                          }
                                        : todo;
                                }
                            );

                            break;
                        }
                    }

                    return {
                        ...state,

                        todos,

                        undoStack:
                            state.undoStack.slice(
                                0,
                                -1
                            ),

                        redoStack: trimHistory([
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

                    let todos = [
                        ...state.todos,
                    ];

                    switch (action.type) {
                        case "add":
                            todos =
                                reorderIndexes([
                                    action.todo,
                                    ...todos,
                                ]);
                            break;

                        case "delete": {
                            const ids = new Set(
                                action.removed.map(
                                    item =>
                                        item.todo.id
                                )
                            );

                            todos =
                                reorderIndexes(
                                    todos.filter(
                                        todo =>
                                            !ids.has(
                                                todo.id
                                            )
                                    )
                                );

                            break;
                        }

                        case "update":
                            todos = todos.map(
                                todo =>
                                    todo.id ===
                                    action.id
                                        ? {
                                              ...todo,
                                              ...action.after,
                                          }
                                        : todo
                            );
                            break;

                        case "bulk": {
                            const historyMap =
                                new Map(
                                    action.items.map(
                                        item => [
                                            item.id,
                                            item,
                                        ]
                                    )
                                );

                            todos = todos.map(
                                todo => {
                                    const item =
                                        historyMap.get(
                                            todo.id
                                        );

                                    return item
                                        ? {
                                              ...todo,
                                              ...item.after,
                                          }
                                        : todo;
                                }
                            );

                            break;
                        }
                    }

                    return {
                        ...state,

                        todos,

                        redoStack:
                            state.redoStack.slice(
                                0,
                                -1
                            ),

                        undoStack: trimHistory([
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

            setActiveCategory: value =>
                set({
                    activeCategory: value,
                }),

            setHydrated: value =>
                set({
                    hydrated: value,
                }),
        }),

        {
            name: "todo-storage",

            version: 29,

            storage: createJSONStorage(
                () => localStorage
            ),

            migrate: persistedState => {
                const persisted =
                    persistedState as Partial<TodoStore>;

                return {
                    ...persisted,
                    todos: persisted.todos ?? [],
                };
            },

            partialize: state => ({
                todos: state.todos,
                activeCategory:
                    state.activeCategory,
            }),

            onRehydrateStorage:
                () => state => {
                    state?.setHydrated(true);
                },
        }
    )
);

export const useFilteredTodos = () =>
    useTodoStore(state => {
        const filtered = state.todos.filter(
            todo => {
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
            }
        );

        return sortTodos(filtered);
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
```
