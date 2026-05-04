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
        return b.createdAt - a.createdAt;
    });

type Action =
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: { todo: Todo; index: number }[] }
    | { type: "update"; before: Todo; after: Todo }
    | { type: "toggle"; before: Todo; after: Todo }
    | { type: "toggleAll"; before: Todo[]; after: Todo[] }
    | { type: "reorder"; from: number; to: number }
    | { type: "clearCompleted"; removed: { todo: Todo; index: number }[] };

const apply = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete":
        case "clearCompleted": {
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

        case "delete":
        case "clearCompleted": {
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
    activeCategory: FilterType;

    undoStack: Action[];
    redoStack: Action[];

    addTodo: (text: string) => void;
    updateTodo: (id: string, text: string) => void;
    toggleTodo: (id: string) => void;
    toggleAll: () => void;

    deleteTodo: (id: string) => void;
    deleteMany: (ids: string[]) => void;
    clearCompleted: () => void;

    setPriority: (id: string, p: Priority) => void;
    togglePinned: (id: string) => void;

    undo: () => void;
    redo: () => void;

    reorderTodos: (from: number, to: number) => void;

    setSearch: (v: string) => void;
    setActiveCategory: (v: FilterType) => void;

    stats: () => { total: number; completed: number; active: number };
};

export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            todos: [],
            search: "",
            activeCategory: "tasks",

            undoStack: [],
            redoStack: [],

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
                    };

                    const action: Action = { type: "add", todo };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            updateTodo: (id, text) => {
                const value = text.trim();
                if (!value) return;

                set((state) => {
                    const t = state.todos.find(t => t.id === id);
                    if (!t || t.text === value) return state;

                    const next = {
                        ...t,
                        text: value,
                        normalized: normalizeText(value),
                        updatedAt: Date.now(),
                    };

                    const action: Action = { type: "update", before: t, after: next };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            toggleTodo: (id) => {
                set((state) => {
                    const t = state.todos.find(t => t.id === id);
                    if (!t) return state;

                    const next = {
                        ...t,
                        completed: !t.completed,
                        updatedAt: Date.now(),
                    };

                    const action: Action = { type: "toggle", before: t, after: next };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            toggleAll: () => {
                set((state) => {
                    const allDone = state.todos.every(t => t.completed);

                    const next = state.todos.map(t => ({
                        ...t,
                        completed: !allDone,
                        updatedAt: Date.now(),
                    }));

                    const action: Action = {
                        type: "toggleAll",
                        before: state.todos,
                        after: next,
                    };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            deleteTodo: (id) => {
                set((state) => {
                    const removed = buildRemoved(state.todos, [id]);
                    if (!removed.length) return state;

                    const action: Action = { type: "delete", removed };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            deleteMany: (ids) => {
                set((state) => {
                    const removed = buildRemoved(state.todos, ids);
                    if (!removed.length) return state;

                    const action: Action = { type: "delete", removed };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            clearCompleted: () => {
                set((state) => {
                    const ids = state.todos.filter(t => t.completed).map(t => t.id);
                    const removed = buildRemoved(state.todos, ids);
                    if (!removed.length) return state;

                    const action: Action = { type: "clearCompleted", removed };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            setPriority: (id, p) => {
                set((state) => {
                    const t = state.todos.find(t => t.id === id);
                    if (!t || t.priority === p) return state;

                    const next = { ...t, priority: p, updatedAt: Date.now() };

                    const action: Action = { type: "update", before: t, after: next };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            togglePinned: (id) => {
                set((state) => {
                    const t = state.todos.find(t => t.id === id);
                    if (!t) return state;

                    const next = { ...t, pinned: !t.pinned, updatedAt: Date.now() };

                    const action: Action = { type: "update", before: t, after: next };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            reorderTodos: (from, to) => {
                set((state) => {
                    const action: Action = { type: "reorder", from, to };

                    return {
                        todos: apply(state.todos, action),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                        redoStack: [],
                    };
                });
            },

            undo: () => {
                set((state) => {
                    const action = state.undoStack.at(-1);
                    if (!action) return state;

                    return {
                        todos: revert(state.todos, action),
                        undoStack: state.undoStack.slice(0, -1),
                        redoStack: [...state.redoStack, action].slice(-MAX_HISTORY),
                    };
                });
            },

            redo: () => {
                set((state) => {
                    const action = state.redoStack.at(-1);
                    if (!action) return state;

                    return {
                        todos: apply(state.todos, action),
                        redoStack: state.redoStack.slice(0, -1),
                        undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                    };
                });
            },

            setSearch: (v) => set({ search: v }),
            setActiveCategory: (v) => set({ activeCategory: v }),

            stats: () => {
                const todos = get().todos;
                const total = todos.length;
                const completed = todos.filter(t => t.completed).length;
                return {
                    total,
                    completed,
                    active: total - completed,
                };
            },
        }),
        {
            name: "todo-storage",
            version: 19,
            storage: createJSONStorage(() => localStorage),
            migrate: (state: any) => {
                if (!state.todos) return state;
                return {
                    ...state,
                    todos: state.todos.map((t: any) => ({
                        ...t,
                        normalized: normalizeText(t.text),
                    })),
                };
            },
        }
    )
);

export const useFilteredTodos = () =>
    useTodoStore(
        (s) => {
            const search = normalizeText(s.search);

            return sortTodos(s.todos).filter((t) => {
                if (!t.normalized.includes(search)) return false;

                if (s.activeCategory === "active") return !t.completed;
                if (s.activeCategory === "completed") return t.completed;

                return true;
            });
        },
        shallow
    );