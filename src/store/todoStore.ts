"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";

/* ================= TYPES ================= */

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    updatedAt: number;
}

export type FilterType = "tasks" | "completed" | "active";

type Action =
    | { type: "add"; todo: Todo }
    | { type: "delete"; todo: Todo; index: number }
    | { type: "toggle"; prev: Todo }
    | { type: "edit"; prev: Todo }
    | { type: "reorder"; from: number; to: number }
    | { type: "clear"; removed: Todo[] };

const MAX_STACK = 50;

const pushStack = (stack: Action[], action: Action) => {
    const next = [...stack, action];
    if (next.length > MAX_STACK) next.shift();
    return next;
};

/* ================= STORE ================= */

type TodoStore = {
    todos: Todo[];
    search: string;
    activeCategory: FilterType;

    undoStack: Action[];
    redoStack: Action[];

    addTodo: (text: string) => void;
    updateTodo: (id: string, text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompleted: () => void;

    undo: () => void;
    redo: () => void;

    reorderTodos: (from: number, to: number) => void;

    setSearch: (v: string) => void;
    setActiveCategory: (v: FilterType) => void;
};

export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            todos: [],
            search: "",
            activeCategory: "tasks",

            undoStack: [],
            redoStack: [],

            /* ---------------- ADD ---------------- */
            addTodo: (text) => {
                const value = text.trim();
                if (!value) return;

                const now = Date.now();

                const todo: Todo = {
                    id: crypto.randomUUID(),
                    text: value,
                    completed: false,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    todos: [todo, ...state.todos],
                    undoStack: pushStack(state.undoStack, {
                        type: "add",
                        todo,
                    }),
                    redoStack: [],
                }));
            },

            /* ---------------- EDIT ---------------- */
            updateTodo: (id, text) => {
                const value = text.trim();
                if (!value) return;

                set((state) => {
                    const prev = state.todos.find((t) => t.id === id);
                    if (!prev || prev.text === value) return state;

                    return {
                        todos: state.todos.map((t) =>
                            t.id === id
                                ? { ...t, text: value, updatedAt: Date.now() }
                                : t
                        ),
                        undoStack: pushStack(state.undoStack, {
                            type: "edit",
                            prev,
                        }),
                        redoStack: [],
                    };
                });
            },

            /* ---------------- TOGGLE ---------------- */
            toggleTodo: (id) =>
                set((state) => {
                    const prev = state.todos.find((t) => t.id === id);
                    if (!prev) return state;

                    return {
                        todos: state.todos.map((t) =>
                            t.id === id
                                ? {
                                    ...t,
                                    completed: !t.completed,
                                    updatedAt: Date.now(),
                                }
                                : t
                        ),
                        undoStack: pushStack(state.undoStack, {
                            type: "toggle",
                            prev,
                        }),
                        redoStack: [],
                    };
                }),

            /* ---------------- DELETE ---------------- */
            deleteTodo: (id) =>
                set((state) => {
                    const index = state.todos.findIndex((t) => t.id === id);
                    if (index === -1) return state;

                    const todo = state.todos[index];

                    return {
                        todos: state.todos.filter((t) => t.id !== id),
                        undoStack: pushStack(state.undoStack, {
                            type: "delete",
                            todo,
                            index,
                        }),
                        redoStack: [],
                    };
                }),

            /* ---------------- CLEAR ---------------- */
            clearCompleted: () =>
                set((state) => {
                    const removed = state.todos.filter((t) => t.completed);
                    if (removed.length === 0) return state;

                    return {
                        todos: state.todos.filter((t) => !t.completed),
                        undoStack: pushStack(state.undoStack, {
                            type: "clear",
                            removed,
                        }),
                        redoStack: [],
                    };
                }),

            /* ---------------- UNDO ---------------- */
            undo: () => {
                const action = get().undoStack.at(-1);
                if (!action) return;

                set((state) => {
                    const undoStack = state.undoStack.slice(0, -1);

                    switch (action.type) {
                        case "add":
                            return {
                                todos: state.todos.filter(
                                    (t) => t.id !== action.todo.id
                                ),
                                undoStack,
                                redoStack: pushStack(state.redoStack, action),
                            };

                        case "delete": {
                            const next = [...state.todos];
                            next.splice(action.index, 0, action.todo);
                            return {
                                todos: next,
                                undoStack,
                                redoStack: pushStack(state.redoStack, action),
                            };
                        }

                        case "toggle":
                        case "edit":
                            return {
                                todos: state.todos.map((t) =>
                                    t.id === action.prev.id ? action.prev : t
                                ),
                                undoStack,
                                redoStack: pushStack(state.redoStack, action),
                            };

                        case "reorder": {
                            const arr = [...state.todos];
                            const [moved] = arr.splice(action.to, 1);
                            arr.splice(action.from, 0, moved);
                            return {
                                todos: arr,
                                undoStack,
                                redoStack: pushStack(state.redoStack, action),
                            };
                        }

                        case "clear":
                            return {
                                todos: [...action.removed, ...state.todos],
                                undoStack,
                                redoStack: pushStack(state.redoStack, action),
                            };

                        default:
                            return state;
                    }
                });
            },

            /* ---------------- REDO ---------------- */
            redo: () => {
                const action = get().redoStack.at(-1);
                if (!action) return;

                set((state) => {
                    const redoStack = state.redoStack.slice(0, -1);

                    switch (action.type) {
                        case "add":
                            return {
                                todos: [action.todo, ...state.todos],
                                redoStack,
                            };

                        case "delete":
                            return {
                                todos: state.todos.filter(
                                    (t) => t.id !== action.todo.id
                                ),
                                redoStack,
                            };

                        case "toggle":
                            return {
                                todos: state.todos.map((t) =>
                                    t.id === action.prev.id
                                        ? {
                                            ...t,
                                            completed: !t.completed,
                                        }
                                        : t
                                ),
                                redoStack,
                            };

                        case "edit":
                            return {
                                todos: state.todos.map((t) =>
                                    t.id === action.prev.id
                                        ? {
                                            ...t,
                                            text: t.text,
                                        }
                                        : t
                                ),
                                redoStack,
                            };

                        case "reorder": {
                            const arr = [...state.todos];
                            const [moved] = arr.splice(action.from, 1);
                            arr.splice(action.to, 0, moved);
                            return { todos: arr, redoStack };
                        }

                        case "clear":
                            return {
                                todos: state.todos.filter(
                                    (t) =>
                                        !action.removed.find(
                                            (r) => r.id === t.id
                                        )
                                ),
                                redoStack,
                            };

                        default:
                            return state;
                    }
                });
            },

            /* ---------------- REORDER ---------------- */
            reorderTodos: (from, to) =>
                set((state) => {
                    if (from === to) return state;

                    const arr = [...state.todos];
                    const [moved] = arr.splice(from, 1);
                    arr.splice(to, 0, moved);

                    return {
                        todos: arr,
                        undoStack: pushStack(state.undoStack, {
                            type: "reorder",
                            from,
                            to,
                        }),
                        redoStack: [],
                    };
                }),

            setSearch: (v) => set({ search: v }),
            setActiveCategory: (v) => set({ activeCategory: v }),
        }),
        {
            name: "todo-storage",
            version: 9,
            storage: createJSONStorage(() => localStorage),

            partialize: (s) => ({
                todos: s.todos,
                search: s.search,
                activeCategory: s.activeCategory,
            }),
        }
    )
);

/* ================= SELECTORS ================= */

export const useFilteredTodos = () =>
    useTodoStore(
        (s) => {
            const keyword = s.search.toLowerCase();

            return s.todos.filter((t) => {
                if (!t.text.toLowerCase().includes(keyword)) return false;

                if (s.activeCategory === "active") return !t.completed;
                if (s.activeCategory === "completed") return t.completed;

                return true;
            });
        },
        shallow
    );

export const useTodoStats = () =>
    useTodoStore(
        (s) => {
            const completed = s.todos.filter((t) => t.completed).length;
            const total = s.todos.length;

            return {
                total,
                completed,
                active: total - completed,
                completionRate:
                    total === 0 ? 0 : Math.round((completed / total) * 100),
            };
        },
        shallow
    );