"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
   工具：派生计算（外部纯函数）
----------------------------- */
const calcStats = (todos: Todo[]) => {
    const completed = todos.reduce(
        (acc, t) => acc + (t.completed ? 1 : 0),
        0
    );

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

    /* actions */
    addTodo: (text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompleted: () => void;
    toggleAll: (completed: boolean) => void;
    reorderTodos: (from: number, to: number) => void;

    setSearch: (value: string) => void;
    setCategory: (id: string) => void;
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

            /* -----------------------------
               追加（防重复）
            ----------------------------- */
            addTodo: (text: string) => {
                const value = text.trim();
                if (!value) return;

                set((state) => {
                    const exists = state.todos.some(
                        (t) => t.text === value
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
                    };
                });
            },

            /* -----------------------------
               Toggle
            ----------------------------- */
            toggleTodo: (id: string) => {
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id
                            ? { ...t, completed: !t.completed }
                            : t
                    ),
                }));
            },

            /* -----------------------------
               削除
            ----------------------------- */
            deleteTodo: (id: string) => {
                set((state) => ({
                    todos: state.todos.filter((t) => t.id !== id),
                }));
            },

            /* -----------------------------
               完了削除
            ----------------------------- */
            clearCompleted: () => {
                set((state) => ({
                    todos: state.todos.filter((t) => !t.completed),
                }));
            },

            /* -----------------------------
               全切替
            ----------------------------- */
            toggleAll: (completed: boolean) => {
                set((state) => ({
                    todos: state.todos.map((t) => ({
                        ...t,
                        completed,
                    })),
                }));
            },

            /* -----------------------------
               並び替え（安全版）
            ----------------------------- */
            reorderTodos: (from: number, to: number) => {
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

                    return { todos };
                });
            },

            /* -----------------------------
               UI state
            ----------------------------- */
            setSearch: (value: string) => set({ search: value }),
            setCategory: (id: string) =>
                set({ activeCategory: id }),
        }),
        {
            name: "todo-storage",
            version: 3,

            /* ✅ 只持久化必要数据 */
            partialize: (state) => ({
                todos: state.todos,
            }),

            /* 🔥 类型安全迁移 */
            migrate: (persistedState: unknown, version) => {
                const state = persistedState as any;

                if (!state) return { todos: [] };

                if (version === 1) {
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

export const useTodoStats = () =>
    useTodoStore((state) => calcStats(state.todos));