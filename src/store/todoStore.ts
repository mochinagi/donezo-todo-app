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
    | { type: "edit"; prev: Todo; next: Todo }
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
                    todos: [todo, ...state.todos],
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
                    const index = state.todos.findIndex((t) => t.id === id);
                    if (index === -1) return state;

                    const prev = state.todos[index];
                    if (prev.text === value) return state;

                    const next = {
                        ...prev,
                        text: value,
                        updatedAt: Date.now(),
                    };

                    const todos = [...state.todos];
                    todos[index] = next;

                    return {
                        todos,
                        undoStack: pushStack(state.undoStack, {
                            type: "edit",
                            prev,
                            next,
                        }),
                        redoStack: [],
                    };
                });
            },

            /* ===== TOGGLE ===== */
            toggleTodo: (id) =>
                set((state) => {
                    const index = state.todos.findIndex((t) => t.id === id);
                    if (index === -1) return state;

                    const prev = state.todos[index];

                    const next = {
                        ...prev,
                        completed: !prev.completed,
                        updatedAt: Date.now(),
                    };

                    const todos = [...state.todos];
                    todos[index] = next;

                    return {
                        todos,
                        undoStack: pushStack(state.undoStack, {
                            type: "toggle",
                            prev,
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

                    const todos = [...state.todos];
                    todos.splice(index, 1);

                    return {
                        todos,
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
                    if (removed.length === 0) return state;

                    const todos = state.todos.filter((t) => !t.completed);

                    return {
                        todos,
                        undoStack: pushStack(state.undoStack, {
                            type: "clear",
                            removed,
                        }),
                        redoStack: [],
                    };
                }),

            /* ===== UNDO ===== */
            undo: () => {
                const { undoStack } = get();
                if (undoStack.length === 0) return;

                const action = undoStack[undoStack.length - 1];

                set((state) => ({
                    todos: applyUndo(state.todos, action),
                    undoStack: state.undoStack.slice(0, -1),
                    redoStack: pushStack(state.redoStack, action),
                }));
            },

            /* ===== REDO ===== */
            redo: () => {
                const { redoStack } = get();
                if (redoStack.length === 0) return;

                const action = redoStack[redoStack.length - 1];

                set((state) => ({
                    todos: applyRedo(state.todos, action),
                    redoStack: state.redoStack.slice(0, -1),
                    undoStack: pushStack(state.undoStack, action),
                }));
            },

            /* ===== REORDER ===== */
            reorderTodos: (from, to) =>
                set((state) => {
                    if (
                        from === to ||
                        from < 0 ||
                        to < 0 ||
                        from >= state.todos.length ||
                        to >= state.todos.length
                    )
                        return state;

                    const todos = [...state.todos];
                    const [moved] = todos.splice(from, 1);
                    todos.splice(to, 0, moved);

                    return {
                        todos,
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
            version: 11,
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                todos: s.todos,
                search: s.search,
                activeCategory: s.activeCategory,
            }),
        }
    )
);

/* ================= UNDO / REDO ================= */

const applyUndo = (todos: Todo[], action: Action): Todo[] => {
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
                t.id === action.prev.id ? action.prev : t
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

const applyRedo = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete":
            return todos.filter((t) => t.id !== action.todo.id);

        case "toggle":
            return todos.map((t) =>
                t.id === action.prev.id
                    ? { ...t, completed: !t.completed }
                    : t
            );

        case "edit":
            return todos.map((t) =>
                t.id === action.next.id ? action.next : t
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
            let completed = 0;

            for (const t of s.todos) {
                if (t.completed) completed++;
            }

            const total = s.todos.length;

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