"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";

export type Priority = "low" | "medium" | "high";

export interface Todo {
    id: string;
    text: string;
    normalized: string;
    completed: boolean;
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

const sortTodos = (todos: Todo[]) => {
    return [...todos].sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return Number(b.pinned) - Number(a.pinned);
        }

        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        if (a.priority !== b.priority) {
            return priorityRank[b.priority] - priorityRank[a.priority];
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
            targets.has(todo.id) ? { todo, index } : null
        )
        .filter(Boolean) as RemovedItem[];
};

const computeStats = (todos: Todo[]) => {
    const completed = todos.filter((t) => t.completed).length;
    const archived = todos.filter((t) => t.archived).length;

    return {
        total: todos.length,
        completed,
        active: todos.length - completed,
        archived,
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
                action.removed.map((v) => v.todo.id)
            );

            return todos.filter((t) => !ids.has(t.id));
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
                (t) => t.id !== action.todo.id
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

    addTodo: (text: string) => void;

    updateTodoText: (
        id: string,
        text: string
    ) => void;

    toggleTodo: (id: string) => void;

    togglePinned: (id: string) => void;

    setPriority: (
        id: string,
        priority: Priority
    ) => void;

    setDueDate: (
        id: string,
        dueDate: number | null
    ) => void;

    archiveTodo: (id: string) => void;

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
                        archived: false,
                        priority: "medium",
                        pinned: false,
                        order: state.todos.length,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    };

                    const action: Action = {
                        type: "add",
                        todo,
                    };

                    return commit(
                        state,
                        action,
                        applyAction(state.todos, action)
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

                    const action: Action = {
                        type: "replace",
                        before: state.todos,
                        after: nextTodos,
                    };

                    return commit(
                        state,
                        action,
                        nextTodos
                    );
                }),

            toggleTodo: (id) =>
                set((state) => {
                    const nextTodos = state.todos.map(
                        (todo) =>
                            todo.id === id
                                ? updateTodo(todo, {
                                    completed:
                                        !todo.completed,
                                })
                                : todo
                    );

                    const action: Action = {
                        type: "replace",
                        before: state.todos,
                        after: nextTodos,
                    };

                    return commit(
                        state,
                        action,
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

                    return commit(state, {
                        type: "replace",
                        before: state.todos,
                        after: nextTodos,
                    }, nextTodos);
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

                    return commit(state, {
                        type: "replace",
                        before: state.todos,
                        after: nextTodos,
                    }, nextTodos);
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

                    return commit(state, {
                        type: "replace",
                        before: state.todos,
                        after: nextTodos,
                    }, nextTodos);
                }),

            archiveTodo: (id) =>
                set((state) => {
                    const nextTodos = state.todos.map(
                        (todo) =>
                            todo.id === id
                                ? updateTodo(todo, {
                                    archived:
                                        !todo.archived,
                                })
                                : todo
                    );

                    return commit(state, {
                        type: "replace",
                        before: state.todos,
                        after: nextTodos,
                    }, nextTodos);
                }),

            reorderTodos: (from, to) =>
                set((state) => {
                    if (from === to) {
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

                    return commit(state, {
                        type: "replace",
                        before: state.todos,
                        after: nextTodos,
                    }, nextTodos);
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

            clearCompleted: () =>
                set((state) => {
                    const ids = state.todos
                        .filter(
                            (todo) => todo.completed
                        )
                        .map((todo) => todo.id);

                    return get().deleteMany(ids);
                }),

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
            version: 23,
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
    useTodoStore(
        (state) => {
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
        },
        shallow
    );