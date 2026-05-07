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
    priority: Priority;
    pinned: boolean;
    order: number;
    createdAt: number;
    updatedAt: number;
}

export type FilterType = "tasks" | "completed" | "active";

const MAX_HISTORY = 50;

const normalizeText = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

const now = () => Date.now();

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

        if (a.priority !== b.priority) {
            return priorityRank[b.priority] - priorityRank[a.priority];
        }

        if (a.order !== b.order) {
            return a.order - b.order;
        }

        return b.updatedAt - a.updatedAt;
    });
};

type RemovedItem = {
    todo: Todo;
    index: number;
};

type Action =
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: RemovedItem[] }
    | { type: "update"; before: Todo; after: Todo }
    | { type: "batch-toggle"; before: Todo[]; after: Todo[] }
    | { type: "reorder"; before: Todo[]; after: Todo[] };

const apply = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete": {
            const ids = new Set(action.removed.map((v) => v.todo.id));
            return todos.filter((t) => !ids.has(t.id));
        }

        case "update":
            return todos.map((t) =>
                t.id === action.after.id ? action.after : t
            );

        case "batch-toggle":
        case "reorder":
            return action.after;

        default:
            return todos;
    }
};

const revert = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return todos.filter((t) => t.id !== action.todo.id);

        case "delete": {
            const restored = [...todos];

            [...action.removed]
                .sort((a, b) => a.index - b.index)
                .forEach(({ todo, index }) => {
                    restored.splice(index, 0, todo);
                });

            return restored;
        }

        case "update":
            return todos.map((t) =>
                t.id === action.before.id ? action.before : t
            );

        case "batch-toggle":
        case "reorder":
            return action.before;

        default:
            return todos;
    }
};

const buildRemoved = (todos: Todo[], ids: string[]): RemovedItem[] => {
    const target = new Set(ids);

    return todos
        .map((todo, index) =>
            target.has(todo.id) ? { todo, index } : null
        )
        .filter(Boolean) as RemovedItem[];
};

const computeStats = (todos: Todo[]) => {
    const completed = todos.filter((t) => t.completed).length;

    return {
        total: todos.length,
        completed,
        active: todos.length - completed,
    };
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

    addTodo: (text: string) => void;

    updateTodo: (id: string, text: string) => void;

    toggleTodo: (id: string) => void;

    toggleMany: (ids: string[]) => void;

    toggleAll: () => void;

    deleteTodo: (id: string) => void;

    clearCompleted: () => void;

    setPriority: (id: string, priority: Priority) => void;

    togglePinned: (id: string) => void;

    reorderTodos: (from: number, to: number) => void;

    markAllCompleted: () => void;

    markAllActive: () => void;

    undo: () => void;

    redo: () => void;

    setSearch: (value: string) => void;

    setActiveCategory: (value: FilterType) => void;

    setHydrated: (value: boolean) => void;
};

const push = (
    state: TodoStore,
    action: Action,
    nextTodos: Todo[]
) => {
    const stats = computeStats(nextTodos);

    return {
        ...state,
        todos: nextTodos,
        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
        redoStack: [],
        ...stats,
    };
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

            addTodo: (text) =>
                set((state) => {
                    const value = text.trim();

                    if (!value) return state;

                    const normalized = normalizeText(value);

                    if (
                        state.todos.some(
                            (t) => t.normalized === normalized
                        )
                    ) {
                        return state;
                    }

                    const timestamp = now();

                    const todo: Todo = {
                        id: crypto.randomUUID(),
                        text: value,
                        normalized,
                        completed: false,
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

                    return push(
                        state,
                        action,
                        apply(state.todos, action)
                    );
                }),

            updateTodo: (id, text) =>
                set((state) => {
                    const current = state.todos.find(
                        (t) => t.id === id
                    );

                    if (!current) return state;

                    const value = text.trim();

                    if (!value) return state;

                    const normalized = normalizeText(value);

                    const duplicated = state.todos.some(
                        (t) =>
                            t.id !== id &&
                            t.normalized === normalized
                    );

                    if (duplicated) return state;

                    const nextTodo: Todo = {
                        ...current,
                        text: value,
                        normalized,
                        updatedAt: now(),
                    };

                    const action: Action = {
                        type: "update",
                        before: current,
                        after: nextTodo,
                    };

                    return push(
                        state,
                        action,
                        apply(state.todos, action)
                    );
                }),

            toggleTodo: (id) =>
                set((state) => {
                    const current = state.todos.find(
                        (t) => t.id === id
                    );

                    if (!current) return state;

                    const nextTodo: Todo = {
                        ...current,
                        completed: !current.completed,
                        updatedAt: now(),
                    };

                    const action: Action = {
                        type: "update",
                        before: current,
                        after: nextTodo,
                    };

                    return push(
                        state,
                        action,
                        apply(state.todos, action)
                    );
                }),

            toggleMany: (ids) =>
                set((state) => {
                    const target = new Set(ids);

                    const before = state.todos.filter((t) =>
                        target.has(t.id)
                    );

                    if (!before.length) return state;

                    const after = state.todos.map((t) => {
                        if (!target.has(t.id)) {
                            return t;
                        }

                        return {
                            ...t,
                            completed: !t.completed,
                            updatedAt: now(),
                        };
                    });

                    const action: Action = {
                        type: "batch-toggle",
                        before: state.todos,
                        after,
                    };

                    return push(state, action, after);
                }),

            toggleAll: () =>
                set((state) => {
                    const shouldComplete = state.todos.some(
                        (t) => !t.completed
                    );

                    const nextTodos = state.todos.map((t) => ({
                        ...t,
                        completed: shouldComplete,
                        updatedAt: now(),
                    }));

                    const action: Action = {
                        type: "batch-toggle",
                        before: state.todos,
                        after: nextTodos,
                    };

                    return push(state, action, nextTodos);
                }),

            deleteTodo: (id) =>
                set((state) => {
                    const removed = buildRemoved(
                        state.todos,
                        [id]
                    );

                    if (!removed.length) return state;

                    const action: Action = {
                        type: "delete",
                        removed,
                    };

                    return push(
                        state,
                        action,
                        apply(state.todos, action)
                    );
                }),

            clearCompleted: () =>
                set((state) => {
                    const ids = state.todos
                        .filter((t) => t.completed)
                        .map((t) => t.id);

                    const removed = buildRemoved(
                        state.todos,
                        ids
                    );

                    if (!removed.length) return state;

                    const action: Action = {
                        type: "delete",
                        removed,
                    };

                    return push(
                        state,
                        action,
                        apply(state.todos, action)
                    );
                }),

            setPriority: (id, priority) =>
                set((state) => {
                    const current = state.todos.find(
                        (t) => t.id === id
                    );

                    if (!current) return state;

                    const nextTodo: Todo = {
                        ...current,
                        priority,
                        updatedAt: now(),
                    };

                    const action: Action = {
                        type: "update",
                        before: current,
                        after: nextTodo,
                    };

                    return push(
                        state,
                        action,
                        apply(state.todos, action)
                    );
                }),

            togglePinned: (id) =>
                set((state) => {
                    const current = state.todos.find(
                        (t) => t.id === id
                    );

                    if (!current) return state;

                    const nextTodo: Todo = {
                        ...current,
                        pinned: !current.pinned,
                        updatedAt: now(),
                    };

                    const action: Action = {
                        type: "update",
                        before: current,
                        after: nextTodo,
                    };

                    return push(
                        state,
                        action,
                        apply(state.todos, action)
                    );
                }),

            reorderTodos: (from, to) =>
                set((state) => {
                    if (from === to) return state;

                    const reordered = [...state.todos];

                    const [moved] = reordered.splice(from, 1);

                    reordered.splice(to, 0, moved);

                    const nextTodos = reordered.map((todo, index) => ({
                        ...todo,
                        order: index,
                    }));

                    const action: Action = {
                        type: "reorder",
                        before: state.todos,
                        after: nextTodos,
                    };

                    return push(state, action, nextTodos);
                }),

            markAllCompleted: () => {
                get().toggleAll();
            },

            markAllActive: () =>
                set((state) => {
                    const nextTodos = state.todos.map((t) => ({
                        ...t,
                        completed: false,
                        updatedAt: now(),
                    }));

                    const action: Action = {
                        type: "batch-toggle",
                        before: state.todos,
                        after: nextTodos,
                    };

                    return push(state, action, nextTodos);
                }),

            undo: () =>
                set((state) => {
                    const action = state.undoStack.at(-1);

                    if (!action) return state;

                    const nextTodos = revert(
                        state.todos,
                        action
                    );

                    return {
                        ...state,
                        todos: nextTodos,
                        undoStack: state.undoStack.slice(0, -1),
                        redoStack: [
                            ...state.redoStack,
                            action,
                        ].slice(-MAX_HISTORY),
                        ...computeStats(nextTodos),
                    };
                }),

            redo: () =>
                set((state) => {
                    const action = state.redoStack.at(-1);

                    if (!action) return state;

                    const nextTodos = apply(
                        state.todos,
                        action
                    );

                    return {
                        ...state,
                        todos: nextTodos,
                        redoStack: state.redoStack.slice(0, -1),
                        undoStack: [
                            ...state.undoStack,
                            action,
                        ].slice(-MAX_HISTORY),
                        ...computeStats(nextTodos),
                    };
                }),

            setSearch: (value) =>
                set({
                    search: value,
                    searchNormalized: normalizeText(value),
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
            version: 22,
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                todos: state.todos,
                search: state.search,
                activeCategory: state.activeCategory,
            }),

            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);

export const useFilteredTodos = () =>
    useTodoStore(
        (state) => {
            const filtered = state.todos.filter((todo) => {
                if (
                    !todo.normalized.includes(
                        state.searchNormalized
                    )
                ) {
                    return false;
                }

                if (state.activeCategory === "active") {
                    return !todo.completed;
                }

                if (state.activeCategory === "completed") {
                    return todo.completed;
                }

                return true;
            });

            return sortTodos(filtered);
        },
        shallow
    );