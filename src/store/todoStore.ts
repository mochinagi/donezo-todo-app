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
    | { type: "toggle"; before: Todo; after: Todo }
    | { type: "edit"; before: Todo; after: Todo }
    | { type: "reorder"; from: number; to: number }
    | { type: "clear"; removed: Todo[] };

const MAX_STACK = 50;

const pushStack = (stack: Action[], action: Action) => {
    const next = [...stack, action];
    if (next.length > MAX_STACK) next.shift();
    return next;
};

/* ================= CORE ================= */

const applyAction = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete":
            return todos.filter((t) => t.id !== action.todo.id);

        case "toggle":
        case "edit":
            return todos.map((t) =>
                t.id === action.after.id ? action.after : t
            );

        case "reorder": {
            const arr = [...todos];
            const [moved] = arr.splice(action.from, 1);
            arr.splice(action.to, 0, moved);
            return arr;
        }

        case "clear": {
            const removedSet = new Set(action.removed.map((r) => r.id));
            return todos.filter((t) => !removedSet.has(t.id));
        }

        default:
            return todos;
    }
};

const revertAction = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return todos.filter((t) => t.id !== action.todo.id);

        case "delete": {
            const arr = [...todos];
            arr.splice(action.index, 0, action.todo);
            return arr;
        }

        case "toggle":
        case "edit":
            return todos.map((t) =>
                t.id === action.before.id ? action.before : t
            );

        case "reorder": {
            const arr = [...todos];
            const [moved] = arr.splice(action.to, 1);
            arr.splice(action.from, 0, moved);
            return arr;
        }

        case "clear":
            return [...action.removed, ...todos];

        default:
            return todos;
    }
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

            /* ===== ADD ===== */
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
                    todos: applyAction(state.todos, { type: "add", todo }),
                    undoStack: pushStack(state.undoStack, {
                        type: "add",
                        todo,
                    }),
                    redoStack: [],
                }));
            },

            /* ===== EDIT ===== */
            updateTodo: (id, text) => {
                const value = text.trim();
                if (!value) return;

                set((state) => {
                    const prev = state.todos.find((t) => t.id === id);
                    if (!prev || prev.text === value) return state;

                    const next = {
                        ...prev,
                        text: value,
                        updatedAt: Date.now(),
                    };

                    return {
                        todos: applyAction(state.todos, {
                            type: "edit",
                            before: prev,
                            after: next,
                        }),
                        undoStack: pushStack(state.undoStack, {
                            type: "edit",
                            before: prev,
                            after: next,
                        }),
                        redoStack: [],
                    };
                });
            },

            /* ===== TOGGLE ===== */
            toggleTodo: (id) =>
                set((state) => {
                    const prev = state.todos.find((t) => t.id === id);
                    if (!prev) return state;

                    const next = {
                        ...prev,
                        completed: !prev.completed,
                        updatedAt: Date.now(),
                    };

                    return {
                        todos: applyAction(state.todos, {
                            type: "toggle",
                            before: prev,
                            after: next,
                        }),
                        undoStack: pushStack(state.undoStack, {
                            type: "toggle",
                            before: prev,
                            after: next,
                        }),
                        redoStack: [],
                    };
                }),

            /* ===== DELETE ===== */
            deleteTodo: (id) =>
                set((state) => {
                    const index = state.todos.findIndex((t) => t.id === id);
                    if (index === -1) return state;

                    const todo = state.todos[index];

                    return {
                        todos: applyAction(state.todos, {
                            type: "delete",
                            todo,
                            index,
                        }),
                        undoStack: pushStack(state.undoStack, {
                            type: "delete",
                            todo,
                            index,
                        }),
                        redoStack: [],
                    };
                }),

            /* ===== CLEAR ===== */
            clearCompleted: () =>
                set((state) => {
                    const removed = state.todos.filter((t) => t.completed);
                    if (!removed.length) return state;

                    return {
                        todos: applyAction(state.todos, {
                            type: "clear",
                            removed,
                        }),
                        undoStack: pushStack(state.undoStack, {
                            type: "clear",
                            removed,
                        }),
                        redoStack: [],
                    };
                }),

            /* ===== UNDO ===== */
            undo: () => {
                const action = get().undoStack.at(-1);
                if (!action) return;

                set((state) => ({
                    todos: revertAction(state.todos, action),
                    undoStack: state.undoStack.slice(0, -1),
                    redoStack: pushStack(state.redoStack, action),
                }));
            },

            /* ===== REDO ===== */
            redo: () => {
                const action = get().redoStack.at(-1);
                if (!action) return;

                set((state) => ({
                    todos: applyAction(state.todos, action),
                    redoStack: state.redoStack.slice(0, -1),
                    undoStack: pushStack(state.undoStack, action),
                }));
            },

            /* ===== REORDER ===== */
            reorderTodos: (from, to) =>
                set((state) => {
                    if (from === to) return state;

                    return {
                        todos: applyAction(state.todos, {
                            type: "reorder",
                            from,
                            to,
                        }),
                        undoStack: pushStack(state.undoStack, {
                            type: "reorder",
                            from,
                            to,
                        }),
                        redoStack: [],
                    };
                }),

            setSearch: (v) =>
                set({ search: v.trim().toLowerCase() }),

            setActiveCategory: (v) =>
                set({ activeCategory: v }),
        }),
        {
            name: "todo-storage",
            version: 12,
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
            return s.todos.filter((t) => {
                if (!t.text.toLowerCase().includes(s.search)) return false;

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
            const total = s.todos.length;
            const completed = s.todos.filter((t) => t.completed).length;

            return {
                total,
                completed,
                active: total - completed,
                completionRate:
                    total === 0
                        ? 0
                        : Math.round((completed / total) * 100),
            };
        },
        shallow
    );