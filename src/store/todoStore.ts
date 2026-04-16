"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ================= TYPES ================= */

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

export type FilterType = "tasks" | "completed" | "active";

type UndoAction =
    | { type: "delete"; payload: { todo: Todo; index: number } }
    | { type: "add"; payload: { id: string } }
    | { type: "toggle"; payload: { prev: Todo } }
    | { type: "edit"; payload: { prev: Todo } }
    | { type: "reorder"; payload: { from: number; to: number } };

const MAX_UNDO = 50;

/* ================= UTILS ================= */

function pushUndo(stack: UndoAction[], action: UndoAction) {
    const next = [...stack, action];
    if (next.length > MAX_UNDO) next.shift();
    return next;
}

/* ================= STORE ================= */

type TodoStore = {
    todos: Todo[];
    search: string;
    activeCategory: FilterType;
    lastUpdated: number;

    undoStack: UndoAction[];

    addTodo: (text: string) => void;
    updateTodo: (id: string, text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompleted: () => void;
    undo: () => void;

    toggleAll: (completed: boolean) => void;
    reorderTodos: (from: number, to: number) => void;

    setSearch: (value: string) => void;
    setActiveCategory: (id: FilterType) => void;
};

/* ================= STORE ================= */

export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            todos: [],
            search: "",
            activeCategory: "tasks",
            lastUpdated: Date.now(),
            undoStack: [],

            /* ---------------- ADD ---------------- */
            addTodo: (text) => {
                const value = text.trim();
                if (!value) return;

                const id = crypto.randomUUID();

                set((state) => {
                    if (
                        state.todos.some(
                            (t) =>
                                t.text.toLowerCase() === value.toLowerCase()
                        )
                    ) return state;

                    return {
                        todos: [
                            { id, text: value, completed: false },
                            ...state.todos,
                        ],
                        undoStack: pushUndo(state.undoStack, {
                            type: "add",
                            payload: { id },
                        }),
                        lastUpdated: Date.now(),
                    };
                });
            },

            /* ---------------- EDIT ---------------- */
            updateTodo: (id, text) => {
                const value = text.trim();
                if (!value) return;

                set((state) => ({
                    todos: state.todos.map((t) => {
                        if (t.id !== id) return t;
                        if (t.text === value) return t;

                        state.undoStack = pushUndo(state.undoStack, {
                            type: "edit",
                            payload: { prev: t },
                        });

                        return { ...t, text: value };
                    }),
                    lastUpdated: Date.now(),
                }));
            },

            /* ---------------- TOGGLE ---------------- */
            toggleTodo: (id) => {
                set((state) => ({
                    todos: state.todos.map((t) => {
                        if (t.id !== id) return t;

                        state.undoStack = pushUndo(state.undoStack, {
                            type: "toggle",
                            payload: { prev: t },
                        });

                        return { ...t, completed: !t.completed };
                    }),
                    lastUpdated: Date.now(),
                }));
            },

            /* ---------------- DELETE ---------------- */
            deleteTodo: (id) => {
                set((state) => {
                    const index = state.todos.findIndex((t) => t.id === id);
                    if (index === -1) return state;

                    return {
                        todos: state.todos.filter((t) => t.id !== id),
                        undoStack: pushUndo(state.undoStack, {
                            type: "delete",
                            payload: {
                                todo: state.todos[index],
                                index,
                            },
                        }),
                        lastUpdated: Date.now(),
                    };
                });
            },

            /* ---------------- CLEAR ---------------- */
            clearCompleted: () => {
                set((state) => ({
                    todos: state.todos.filter((t) => !t.completed),
                    lastUpdated: Date.now(),
                }));
            },

            /* ---------------- UNDO ---------------- */
            undo: () => {
                const action = get().undoStack.at(-1);
                if (!action) return;

                set((state) => {
                    const stack = state.undoStack.slice(0, -1);

                    switch (action.type) {
                        case "delete": {
                            const updated = [...state.todos];
                            updated.splice(
                                action.payload.index,
                                0,
                                action.payload.todo
                            );
                            return { todos: updated, undoStack: stack };
                        }

                        case "add":
                            return {
                                todos: state.todos.filter(
                                    (t) => t.id !== action.payload.id
                                ),
                                undoStack: stack,
                            };

                        case "toggle":
                        case "edit":
                            return {
                                todos: state.todos.map((t) =>
                                    t.id === action.payload.prev.id
                                        ? action.payload.prev
                                        : t
                                ),
                                undoStack: stack,
                            };

                        case "reorder": {
                            const updated = [...state.todos];
                            const [moved] = updated.splice(action.payload.to, 1);
                            updated.splice(action.payload.from, 0, moved);
                            return { todos: updated, undoStack: stack };
                        }

                        default:
                            return state;
                    }
                });
            },

            /* ---------------- TOGGLE ALL ---------------- */
            toggleAll: (completed) =>
                set((state) => ({
                    todos: state.todos.map((t) => ({
                        ...t,
                        completed,
                    })),
                })),

            /* ---------------- REORDER ---------------- */
            reorderTodos: (from, to) =>
                set((state) => {
                    if (from === to) return state;

                    const todos = [...state.todos];
                    const [moved] = todos.splice(from, 1);
                    todos.splice(to, 0, moved);

                    return {
                        todos,
                        undoStack: pushUndo(state.undoStack, {
                            type: "reorder",
                            payload: { from, to },
                        }),
                    };
                }),

            setSearch: (value) => set({ search: value }),
            setActiveCategory: (id) =>
                set({ activeCategory: id }),
        }),
        {
            name: "todo-storage",
            version: 7,
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                todos: state.todos,
                search: state.search,
                activeCategory: state.activeCategory,
            }),

            migrate: (persisted: any) => {
                if (!persisted?.todos) return { todos: [] };

                return {
                    ...persisted,
                    todos: persisted.todos.map((t: any) => ({
                        id: String(t.id),
                        text: String(t.text ?? ""),
                        completed: Boolean(t.completed),
                    })),
                };
            },
        }
    )
);

/* ================= SELECTORS ================= */

export const useFilteredTodos = () =>
    useTodoStore((state) => {
        const keyword = state.search.toLowerCase();

        return state.todos.filter((t) => {
            if (!t.text.toLowerCase().includes(keyword)) return false;

            if (state.activeCategory === "active") return !t.completed;
            if (state.activeCategory === "completed") return t.completed;

            return true;
        });
    });

export const useTodoStats = () =>
    useTodoStore((state) => {
        let completed = 0;

        for (const t of state.todos) {
            if (t.completed) completed++;
        }

        const total = state.todos.length;

        return {
            total,
            completed,
            active: total - completed,
            completionRate:
                total === 0 ? 0 : Math.round((completed / total) * 100),
            hasCompleted: completed > 0,
        };
    });