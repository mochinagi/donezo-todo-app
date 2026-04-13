"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* -----------------------------
   型定義
----------------------------- */
export interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

export type FilterType = "tasks" | "completed" | "active";

/* -----------------------------
   工具：派生计算
----------------------------- */
const calcStats = (todos: Todo[]) => {
    let completed = 0;

    for (const t of todos) {
        if (t.completed) completed++;
    }

    return {
        total: todos.length,
        completedCount: completed,
        activeCount: todos.length - completed,
    };
};

/* -----------------------------
   Store 类型
----------------------------- */
type TodoStore = {
    /* state */
    todos: Todo[];
    search: string;
    activeCategory: FilterType;
    lastUpdated: number;

    /* derived */
    filteredTodos: () => Todo[];

    /* actions */
    addTodo: (text: string) => void;
    updateTodo: (id: string, text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompleted: () => void;
    toggleAll: (completed: boolean) => void;
    reorderTodos: (from: number, to: number) => void;

    setSearch: (value: string) => void;
    setActiveCategory: (id: FilterType) => void;
};

/* -----------------------------
   Store
----------------------------- */
export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            /* state */
            todos: [],
            search: "",
            activeCategory: "tasks",
            lastUpdated: Date.now(),

            /* -----------------------------
               派生：过滤（升级🔥）
            ----------------------------- */
            filteredTodos: () => {
                const { todos, search, activeCategory } = get();

                const keyword = search.trim().toLowerCase();

                return todos.filter((t) => {
                    const matchText = t.text
                        .toLowerCase()
                        .includes(keyword);

                    if (!matchText) return false;

                    if (activeCategory === "active") {
                        return !t.completed;
                    }

                    if (activeCategory === "completed") {
                        return t.completed;
                    }

                    return true;
                });
            },

            /* -----------------------------
               追加（防重复）
            ----------------------------- */
            addTodo: (text: string) => {
                const value = text.trim();
                if (!value) return;

                set((state) => {
                    const exists = state.todos.some(
                        (t) =>
                            t.text.toLowerCase() ===
                            value.toLowerCase()
                    );

                    if (exists) return state;

                    return {
                        todos: [
                            {
                                id: crypto.randomUUID(),
                                text: value,
                                completed: false,
                            },
                            ...state.todos,
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
                    todos: state.todos.map((t) =>
                        t.id === id ? { ...t, text: value } : t
                    ),
                    lastUpdated: Date.now(),
                }));
            },

            /* ----------------------------- */
            toggleTodo: (id: string) => {
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id
                            ? { ...t, completed: !t.completed }
                            : t
                    ),
                    lastUpdated: Date.now(),
                }));
            },

            /* ----------------------------- */
            deleteTodo: (id: string) => {
                set((state) => ({
                    todos: state.todos.filter((t) => t.id !== id),
                    lastUpdated: Date.now(),
                }));
            },

            /* ----------------------------- */
            clearCompleted: () => {
                set((state) => ({
                    todos: state.todos.filter((t) => !t.completed),
                    lastUpdated: Date.now(),
                }));
            },

            /* ----------------------------- */
            toggleAll: (completed: boolean) => {
                set((state) => ({
                    todos: state.todos.map((t) => ({
                        ...t,
                        completed,
                    })),
                    lastUpdated: Date.now(),
                }));
            },

            /* ----------------------------- */
            reorderTodos: (from, to) => {
                set((state) => {
                    const todos = [...state.todos];

                    if (
                        from === to ||
                        from < 0 ||
                        to < 0 ||
                        from >= todos.length ||
                        to >= todos.length
                    ) {
                        return state;
                    }

                    const [moved] = todos.splice(from, 1);
                    todos.splice(to, 0, moved);

                    return {
                        todos,
                        lastUpdated: Date.now(),
                    };
                });
            },

            /* ----------------------------- */
            setSearch: (value) => set({ search: value }),

            setActiveCategory: (id) =>
                set({ activeCategory: id }),
        }),
        {
            name: "todo-storage",
            version: 5,

            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                todos: state.todos,
            }),

            migrate: (persistedState: unknown) => {
                const state = persistedState as any;

                if (!state || !Array.isArray(state.todos)) {
                    return { todos: [] };
                }

                return {
                    ...state,
                    todos: state.todos.map((t: any) => ({
                        id: String(t.id),
                        text: String(t.text ?? ""),
                        completed: Boolean(t.completed),
                    })),
                };
            },
        }
    )
);

/* -----------------------------
   Stats Hook
----------------------------- */
export const useTodoStats = () =>
    useTodoStore((state) => calcStats(state.todos));