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
    | { type: "toggle"; payload: { id: string } }
    | { type: "edit"; payload: { prev: Todo } };

/* ================= STORE ================= */

type TodoStore = {
    todos: Todo[];
    search: string;
    activeCategory: FilterType;
    lastUpdated: number;

    undoStack: UndoAction[];

    /* actions */
    addTodo: (text: string) => void;
    updateTodo: (id: string, text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompleted: () => Todo[];
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

            /* ----------------------------- */
            addTodo: (text) => {
                const value = text.trim();
                if (!value) return;

                const id = crypto.randomUUID();

                set((state) => {
                    if (
                        state.todos.some(
                            (t) =>
                                t.text.toLowerCase() ===
                                value.toLowerCase()
                        )
                    ) {
                        return state;
                    }

                    return {
                        todos: [
                            { id, text: value, completed: false },
                            ...state.todos,
                        ],
                        undoStack: [
                            ...state.undoStack,
                            { type: "add", payload: { id } },
                        ],
                        lastUpdated: Date.now(),
                    };
                });
            },

            /* ----------------------------- */
            updateTodo: (id, text) => {
                const value = text.trim();
                if (!value) return;

                set((state) => ({
                    todos: state.todos.map((t) => {
                        if (t.id !== id) return t;

                        return { ...t, text: value };
                    }),
                    lastUpdated: Date.now(),
                }));
            },

            /* ----------------------------- */
            toggleTodo: (id) => {
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id
                            ? { ...t, completed: !t.completed }
                            : t
                    ),
                    undoStack: [
                        ...state.undoStack,
                        { type: "toggle", payload: { id } },
                    ],
                    lastUpdated: Date.now(),
                }));
            },

            /* ----------------------------- */
            deleteTodo: (id) => {
                set((state) => {
                    const index = state.todos.findIndex(
                        (t) => t.id === id
                    );
                    if (index === -1) return state;

                    return {
                        todos: state.todos.filter(
                            (t) => t.id !== id
                        ),
                        undoStack: [
                            ...state.undoStack,
                            {
                                type: "delete",
                                payload: {
                                    todo: state.todos[index],
                                    index,
                                },
                            },
                        ],
                        lastUpdated: Date.now(),
                    };
                });
            },

            /* ----------------------------- */
            clearCompleted: () => {
                const removed = get().todos.filter((t) => t.completed);

                set((state) => ({
                    todos: state.todos.filter((t) => !t.completed),
                    lastUpdated: Date.now(),
                }));

                return removed;
            },

            /* ----------------------------- */
            undo: () => {
                const action = get().undoStack.at(-1);
                if (!action) return;

                set((state) => {
                    const newStack = state.undoStack.slice(0, -1);

                    switch (action.type) {
                        case "delete": {
                            const updated = [...state.todos];
                            updated.splice(
                                action.payload.index,
                                0,
                                action.payload.todo
                            );
                            return { todos: updated, undoStack: newStack };
                        }

                        case "add":
                            return {
                                todos: state.todos.filter(
                                    (t) => t.id !== action.payload.id
                                ),
                                undoStack: newStack,
                            };

                        case "toggle":
                            return {
                                todos: state.todos.map((t) =>
                                    t.id === action.payload.id
                                        ? {
                                            ...t,
                                            completed: !t.completed,
                                        }
                                        : t
                                ),
                                undoStack: newStack,
                            };

                        default:
                            return state;
                    }
                });
            },

            /* ----------------------------- */
            toggleAll: (completed) =>
                set((state) => ({
                    todos: state.todos.map((t) => ({
                        ...t,
                        completed,
                    })),
                })),

            /* ----------------------------- */
            reorderTodos: (from, to) =>
                set((state) => {
                    const todos = [...state.todos];
                    if (from === to) return state;

                    const [moved] = todos.splice(from, 1);
                    todos.splice(to, 0, moved);

                    return { todos };
                }),

            setSearch: (value) => set({ search: value }),
            setActiveCategory: (id) =>
                set({ activeCategory: id }),
        }),
        {
            name: "todo-storage",
            version: 6,
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                todos: state.todos,
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
        const total = state.todos.length;
        const completed = state.todos.filter((t) => t.completed).length;

        return {
            total,
            completed,
            active: total - completed,
            completionRate:
                total === 0 ? 0 : Math.round((completed / total) * 100),
            hasCompleted: completed > 0,
        };
    });