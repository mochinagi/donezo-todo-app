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
    createdAt: number;
    updatedAt: number;
    lastViewedAt: number;
}

export type FilterType = "tasks" | "completed" | "active";

const MAX_HISTORY = 50;

const normalizeText = (v: string) =>
    v.trim().replace(/\s+/g, " ").toLowerCase();

const priorityRank: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
};

const sortTodos = (todos: Todo[]) =>
    [...todos].sort((a, b) => {
        if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
        if (a.priority !== b.priority) return priorityRank[b.priority] - priorityRank[a.priority];
        return b.lastViewedAt - a.lastViewedAt;
    });

type Action =
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: { todo: Todo; index: number }[] }
    | { type: "update"; before: Todo; after: Todo }
    | { type: "toggle"; before: Todo; after: Todo }
    | { type: "toggleAll"; before: Todo[]; after: Todo[] }
    | { type: "reorder"; from: number; to: number };

const apply = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete": {
            const ids = new Set(action.removed.map(r => r.todo.id));
            return todos.filter(t => !ids.has(t.id));
        }

        case "update":
        case "toggle":
            return todos.map(t =>
                t.id === action.after.id ? action.after : t
            );

        case "toggleAll":
            return action.after;

        case "reorder": {
            if (action.from === action.to) return todos;
            const arr = [...todos];
            const [moved] = arr.splice(action.from, 1);
            arr.splice(action.to, 0, moved);
            return arr;
        }

        default:
            return todos;
    }
};

const revert = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return todos.filter(t => t.id !== action.todo.id);

        case "delete": {
            const arr = [...todos];
            [...action.removed]
                .sort((a, b) => a.index - b.index)
                .forEach(({ todo, index }) => {
                    arr.splice(index, 0, todo);
                });
            return arr;
        }

        case "update":
        case "toggle":
            return todos.map(t =>
                t.id === action.before.id ? action.before : t
            );

        case "toggleAll":
            return action.before;

        case "reorder": {
            const arr = [...todos];
            const [moved] = arr.splice(action.to, 1);
            arr.splice(action.from, 0, moved);
            return arr;
        }

        default:
            return todos;
    }
};

const buildRemoved = (todos: Todo[], ids: string[]) => {
    const set = new Set(ids);
    return todos
        .map((t, i) => (set.has(t.id) ? { todo: t, index: i } : null))
        .filter(Boolean) as { todo: Todo; index: number }[];
};

type TodoStore = {
    todos: Todo[];
    search: string;
    searchNormalized: string;
    activeCategory: FilterType;

    undoStack: Action[];
    redoStack: Action[];

    total: number;
    completed: number;

    addTodo: (text: string) => void;
    updateTodo: (id: string, text: string) => void;
    toggleTodo: (id: string) => void;
    toggleMany: (ids: string[]) => void;
    toggleAll: () => void;

    deleteTodo: (id: string) => void;

    setPriority: (id: string, p: Priority) => void;
    togglePinned: (id: string) => void;

    undo: () => void;
    redo: () => void;

    reorderTodos: (from: number, to: number) => void;

    setSearch: (v: string) => void;
    setActiveCategory: (v: FilterType) => void;
};

const push = (state: TodoStore, action: Action, nextTodos: Todo[]) => ({
    todos: nextTodos,
    undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
    redoStack: [],
    total: nextTodos.length,
    completed: nextTodos.filter(t => t.completed).length,
});

export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            todos: [],
            search: "",
            searchNormalized: "",
            activeCategory: "tasks",

            undoStack: [],
            redoStack: [],

            total: 0,
            completed: 0,

            addTodo: (text) => {
                const value = text.trim();
                if (!value) return;

                const normalized = normalizeText(value);

                set((state) => {
                    if (state.todos.some(t => t.normalized === normalized)) return state;

                    const now = Date.now();

                    const todo: Todo = {
                        id: crypto.randomUUID(),
                        text: value,
                        normalized,
                        completed: false,
                        priority: "medium",
                        pinned: false,
                        createdAt: now,
                        updatedAt: now,
                        lastViewedAt: now,
                    };

                    const action: Action = { type: "add", todo };
                    const next = apply(state.todos, action);

                    return push(state, action, next);
                });
            },

            updateTodo: (id, text) => {
                const value = text.trim();
                if (!value) return;

                set((state) => {
                    const t = state.todos.find(t => t.id === id);
                    if (!t) return state;

                    const nextTodo = {
                        ...t,
                        text: value,
                        normalized: normalizeText(value),
                        updatedAt: Date.now(),
                        lastViewedAt: Date.now(),
                    };

                    const action: Action = { type: "update", before: t, after: nextTodo };
                    const next = apply(state.todos, action);

                    return push(state, action, next);
                });
            },

            toggleTodo: (id) => {
                set((state) => {
                    const t = state.todos.find(t => t.id === id);
                    if (!t) return state;

                    const nextTodo = {
                        ...t,
                        completed: !t.completed,
                        updatedAt: Date.now(),
                        lastViewedAt: Date.now(),
                    };

                    const action: Action = { type: "toggle", before: t, after: nextTodo };
                    const next = apply(state.todos, action);

                    return push(state, action, next);
                });
            },

            toggleMany: (ids) => {
                set((state) => {
                    const setIds = new Set(ids);
                    const before = state.todos.filter(t => setIds.has(t.id));

                    const afterTodos = state.todos.map(t =>
                        setIds.has(t.id)
                            ? { ...t, completed: !t.completed, updatedAt: Date.now() }
                            : t
                    );

                    const action: Action = {
                        type: "toggleAll",
                        before,
                        after: afterTodos,
                    };

                    return push(state, action, afterTodos);
                });
            },

            toggleAll: () => {
                set((state) => {
                    const allDone = state.todos.every(t => t.completed);

                    const nextTodos = state.todos.map(t => ({
                        ...t,
                        completed: !allDone,
                        updatedAt: Date.now(),
                    }));

                    const action: Action = {
                        type: "toggleAll",
                        before: state.todos,
                        after: nextTodos,
                    };

                    return push(state, action, nextTodos);
                });
            },

            deleteTodo: (id) => {
                set((state) => {
                    const removed = buildRemoved(state.todos, [id]);
                    if (!removed.length) return state;

                    const action: Action = { type: "delete", removed };
                    const next = apply(state.todos, action);

                    return push(state, action, next);
                });
            },

            setPriority: (id, p) => {
                set((state) => {
                    const t = state.todos.find(t => t.id === id);
                    if (!t) return state;

                    const nextTodo = { ...t, priority: p, updatedAt: Date.now() };

                    const action: Action = { type: "update", before: t, after: nextTodo };
                    const next = apply(state.todos, action);

                    return push(state, action, next);
                });
            },

            togglePinned: (id) => {
                set((state) => {
                    const t = state.todos.find(t => t.id === id);
                    if (!t) return state;

                    const nextTodo = { ...t, pinned: !t.pinned, updatedAt: Date.now() };

                    const action: Action = { type: "update", before: t, after: nextTodo };
                    const next = apply(state.todos, action);

                    return push(state, action, next);
                });
            },

            reorderTodos: (from, to) => {
                set((state) => {
                    const action: Action = { type: "reorder", from, to };
                    const next = apply(state.todos, action);

                    return push(state, action, next);
                });
            },

            undo: () => {
                set((state) => {
                    const action = state.undoStack.at(-1);
                    if (!action) return state;

                    const next = revert(state.todos, action);

                    return {
                        ...state,
                        todos: next,
                        undoStack: state.undoStack.slice(0, -1),
                        redoStack: [...state.redoStack, action].slice(-MAX_HISTORY),
                        total: next.length,
                        completed: next.filter(t => t.completed).length,
                    };
                });
            },

            redo: () => {
                set((state) => {
                    const action = state.redoStack.at(-1);
                    if (!action) return state;

                    const next = apply(state.todos, action);

                    return {
                        ...state,
                        todos: next,
                        redoStack: state.redoStack.slice(0, -1),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        total: next.length,
                        completed: next.filter(t => t.completed).length,
                    };
                });
            },

            setSearch: (v) =>
                set({
                    search: v,
                    searchNormalized: normalizeText(v),
                }),

            setActiveCategory: (v) => set({ activeCategory: v }),
        }),
        {
            name: "todo-storage",
            version: 20,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                todos: state.todos,
                search: state.search,
                activeCategory: state.activeCategory,
            }),
        }
    )
);

export const useFilteredTodos = () =>
    useTodoStore(
        (s) => {
            return sortTodos(s.todos).filter((t) => {
                if (!t.normalized.includes(s.searchNormalized)) return false;

                if (s.activeCategory === "active") return !t.completed;
                if (s.activeCategory === "completed") return t.completed;

                return true;
            });
        },
        shallow
    );