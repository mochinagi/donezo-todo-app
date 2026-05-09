"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Priority = "low" | "medium" | "high";

export interface Todo {
    id: string;
    text: string;
    normalized: string;
    completed: boolean;
    completedAt?: number | null;
    archived: boolean;
    priority: Priority;
    pinned: boolean;
    order: number;
    dueDate?: number | null;
    createdAt: number;
    updatedAt: number;
}

export type FilterType =
    | "tasks"
    | "active"
    | "completed"
    | "archived";

const MAX_HISTORY = 50;

const now = () => Date.now();

const normalizeText = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

const priorityRank: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
};

const isOverdue = (todo: Todo) => {
    if (!todo.dueDate || todo.completed) {
        return false;
    }

    return todo.dueDate < now();
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
            return priorityRank[b.priority] - priorityRank[a.priority];
        }

        if (a.dueDate && b.dueDate) {
            return a.dueDate - b.dueDate;
        }

        return a.order - b.order;
    });
};

type RemovedItem = {
    todo: Todo;
    index: number;
};

type Action =
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: RemovedItem[] }
    | { type: "replace"; before: Todo[]; after: Todo[] };

const buildRemoved = (
    todos: Todo[],
    ids: string[]
): RemovedItem[] => {
    const targets = new Set(ids);

    return todos
        .map((todo, index) =>
            targets.has(todo.id)
                ? { todo, index }
                : null
        )
        .filter(Boolean) as RemovedItem[];
};

const computeStats = (todos: Todo[]) => {
    const completed = todos.filter(
        (todo) => todo.completed
    ).length;

    const archived = todos.filter(
        (todo) => todo.archived
    ).length;

    const overdue = todos.filter(isOverdue).length;

    return {
        total: todos.length,
        completed,
        active: todos.length - completed,
        archived,
        overdue,
    };
};

const updateTodo = (
    todo: Todo,
    patch: Partial<Todo>
): Todo => ({
    ...todo,
    ...patch,
    updatedAt: now(),
});

const applyAction = (
    todos: Todo[],
    action: Action
): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete": {
            const ids = new Set(
                action.removed.map(
                    (item) => item.todo.id
                )
            );

            return todos.filter(
                (todo) => !ids.has(todo.id)
            );
        }

        case "replace":
            return action.after;

        default:
            return todos;
    }
};

const revertAction = (
    todos: Todo[],
    action: Action
): Todo[] => {
    switch (action.type) {
        case "add":
            return todos.filter(
                (todo) => todo.id !== action.todo.id
            );

        case "delete": {
            const restored = [...todos];

            [...action.removed]
                .sort((a, b) => a.index - b.index)
                .forEach(({ todo, index }) => {
                    restored.splice(index, 0, todo);
                });

            return restored;
        }

        case "replace":
            return action.before;

        default:
            return todos;
    }
};

type TodoStore = {
    todos: Todo[];

    search: string;
    searchNormalized: string;

    activeCategory: FilterType;

    hydrated: boolean;

    undoStack: Action[];
    redoStack: Action[];

    total: number;
    completed: number;
    active: number;
    archived: number;
    overdue: number;

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

    setHydrated: (value: boolean) => void;
};

const commit = (
    state: TodoStore,
    action: Action,
    todos: Todo[]
) => ({
    ...state,
    todos,
    undoStack: [...state.undoStack, action].slice(
        -MAX_HISTORY
    ),
    redoStack: [],
    ...computeStats(todos),
});

const replaceTodos = (
    state: TodoStore,
    nextTodos: Todo[]
) => {
    const action: Action = {
        type: "replace",
        before: state.todos,
        after: nextTodos,
    };

    return commit(state, action, nextTodos);
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

            total: 0,
            completed: 0,
            active: 0,
            archived: 0,
            overdue: 0,

            addTodo: (text) =>
                set((state) => {
                    const value = text.trim();

                    if (!value) {
                        return state;
                    }

                    const normalized =
                        normalizeText(value);

                    const exists = state.todos.some(
                        (todo) =>
                            todo.normalized === normalized
                    );

                    if (exists) {
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
                        order: state.todos.length,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    };

                    return commit(
                        state,
                        {
                            type: "add",
                            todo,
                        },
                        applyAction(state.todos, {
                            type: "add",
                            todo,
                        })
                    );
                }),

            updateTodoText: (id, text) =>
                set((state) => {
                    const value = text.trim();

                    if (!value) {
                        return state;
                    }

                    const normalized =
                        normalizeText(value);

                    const duplicated =
                        state.todos.some(
                            (todo) =>
                                todo.id !== id &&
                                todo.normalized ===
                                normalized
                        );

                    if (duplicated) {
                        return state;
                    }

                    const nextTodos = state.todos.map(
                        (todo) =>
                            todo.id === id
                                ? updateTodo(todo, {
                                    text: value,
                                    normalized,
                                })
                                : todo
                    );

                    return replaceTodos(
                        state,
                        nextTodos
                    );
                }),

            toggleTodo: (id) =>
                set((state) => {
                    const nextTodos = state.todos.map(
                        (todo) => {
                            if (todo.id !== id) {
                                return todo;
                            }

                            const completed =
                                !todo.completed;

                            return updateTodo(todo, {
                                completed,
                                completedAt:
                                    completed
                                        ? now()
                                        : null,
                            });
                        }
                    );

                    return replaceTodos(
                        state,
                        nextTodos
                    );
                }),

            toggleMany: (ids, completed) =>
                set((state) => {
                    const targets = new Set(ids);

                    const nextTodos = state.todos.map(
                        (todo) =>
                            targets.has(todo.id)
                                ? updateTodo(todo, {
                                    completed,
                                    completedAt:
                                        completed
                                            ? now()
                                            : null,
                                })
                                : todo
                    );

                    return replaceTodos(
                        state,
                        nextTodos
                    );
                }),

            togglePinned: (id) =>
                set((state) => {
                    const nextTodos = state.todos.map(
                        (todo) =>
                            todo.id === id
                                ? updateTodo(todo, {
                                    pinned:
                                        !todo.pinned,
                                })
                                : todo
                    );

                    return replaceTodos(
                        state,
                        nextTodos
                    );
                }),

            archiveMany: (ids, archived) =>
                set((state) => {
                    const targets = new Set(ids);

                    const nextTodos = state.todos.map(
                        (todo) =>
                            targets.has(todo.id)
                                ? updateTodo(todo, {
                                    archived,
                                })
                                : todo
                    );

                    return replaceTodos(
                        state,
                        nextTodos
                    );
                }),

            setPriority: (id, priority) =>
                set((state) => {
                    const nextTodos = state.todos.map(
                        (todo) =>
                            todo.id === id
                                ? updateTodo(todo, {
                                    priority,
                                })
                                : todo
                    );

                    return replaceTodos(
                        state,
                        nextTodos
                    );
                }),

            setDueDate: (id, dueDate) =>
                set((state) => {
                    const nextTodos = state.todos.map(
                        (todo) =>
                            todo.id === id
                                ? updateTodo(todo, {
                                    dueDate,
                                })
                                : todo
                    );

                    return replaceTodos(
                        state,
                        nextTodos
                    );
                }),

            reorderTodos: (from, to) =>
                set((state) => {
                    const length =
                        state.todos.length;

                    if (
                        from < 0 ||
                        to < 0 ||
                        from >= length ||
                        to >= length ||
                        from === to
                    ) {
                        return state;
                    }

                    const reordered = [
                        ...state.todos,
                    ];

                    const [moved] =
                        reordered.splice(from, 1);

                    reordered.splice(to, 0, moved);

                    const nextTodos =
                        reordered.map(
                            (todo, index) => ({
                                ...todo,
                                order: index,
                            })
                        );

                    return replaceTodos(
                        state,
                        nextTodos
                    );
                }),

            deleteTodo: (id) => {
                get().deleteMany([id]);
            },

            deleteMany: (ids) =>
                set((state) => {
                    const removed = buildRemoved(
                        state.todos,
                        ids
                    );

                    if (!removed.length) {
                        return state;
                    }

                    const action: Action = {
                        type: "delete",
                        removed,
                    };

                    return commit(
                        state,
                        action,
                        applyAction(
                            state.todos,
                            action
                        )
                    );
                }),

            clearCompleted: () => {
                const ids = get()
                    .todos.filter(
                        (todo) => todo.completed
                    )
                    .map((todo) => todo.id);

                get().deleteMany(ids);
            },

            undo: () =>
                set((state) => {
                    const action =
                        state.undoStack.at(-1);

                    if (!action) {
                        return state;
                    }

                    const todos = revertAction(
                        state.todos,
                        action
                    );

                    return {
                        ...state,
                        todos,
                        undoStack:
                            state.undoStack.slice(
                                0,
                                -1
                            ),
                        redoStack: [
                            ...state.redoStack,
                            action,
                        ],
                        ...computeStats(todos),
                    };
                }),

            redo: () =>
                set((state) => {
                    const action =
                        state.redoStack.at(-1);

                    if (!action) {
                        return state;
                    }

                    const todos = applyAction(
                        state.todos,
                        action
                    );

                    return {
                        ...state,
                        todos,
                        redoStack:
                            state.redoStack.slice(
                                0,
                                -1
                            ),
                        undoStack: [
                            ...state.undoStack,
                            action,
                        ],
                        ...computeStats(todos),
                    };
                }),

            setSearch: (value) =>
                set({
                    search: value,
                    searchNormalized:
                        normalizeText(value),
                }),

            setActiveCategory: (value) =>
                set({
                    activeCategory: value,
                }),

            setHydrated: (value) =>
                set({
                    hydrated: value,
                }),
        }),
        {
            name: "todo-storage",
            version: 24,
            storage: createJSONStorage(
                () => localStorage
            ),

            partialize: (state) => ({
                todos: state.todos,
                activeCategory:
                    state.activeCategory,
            }),

            onRehydrateStorage:
                () => (state) => {
                    state?.setHydrated(true);
                },
        }
    )
);

export const useFilteredTodos = () =>
    useTodoStore((state) => {
        const filtered = state.todos.filter(
            (todo) => {
                if (todo.archived) {
                    return (
                        state.activeCategory ===
                        "archived"
                    );
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