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

export type FilterType = "all" | "completed" | "active";

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
    todos: Todo[];
    search: string;
    activeCategory: string;
    lastUpdated: number;

    /* derived */
    filteredTodos: () => Todo[];

    /* actions */
    addTodo: (text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompleted: () => void;
    toggleAll: (completed: boolean) => void;
    reorderTodos: (from: number, to: number) => void;

    setSearch: (value: string) => void;
    setActiveCategory: (id: string) => void;
};

/* -----------------------------
   Store
----------------------------- */
export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            todos: [],
            search: "",
            activeCategory: "tasks",
            lastUpdated: Date.now(),

            /* -----------------------------
               派生：过滤
            ----------------------------- */
            filteredTodos: () => {
                const { todos, search } = get();

                const keyword = search.trim().toLowerCase();

                return todos.filter((t) => {
                    const matchText = t.text
                        .toLowerCase()
                        .includes(keyword);

                    return matchText;
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
            reorderTodos: (from: number, to: number) => {
                set((state) => {
                    if (from === to) return state;

                    const todos = [...state.todos];

                    if (
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
            setSearch: (value: string) =>
                set({ search: value }),

            setActiveCategory: (id: string) =>
                set({ activeCategory: id }),
        }),
        {
            name: "todo-storage",
            version: 4,

            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                todos: state.todos,
            }),

            migrate: (persistedState: unknown, version) => {
                const state = persistedState as any;

                if (!state) return { todos: [] };

                if (version < 3) {
                    return {
                        ...state,
                        todos: state.todos.map((t: any) => ({
                            ...t,
                            id: String(t.id),
                        })),
                    };
                }

                return state;
            },
        }
    )
);

/* -----------------------------
   Stats Hook
----------------------------- */
export const useTodoStats = () =>
    useTodoStore((state) => calcStats(state.todos));