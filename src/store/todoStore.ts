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

type TodoStore = {
    todos: Todo[];
    search: string;
    activeCategory: string;

    /* derived state */
    total: number;
    completedCount: number;
    activeCount: number;

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

            total: 0,
            completedCount: 0,
            activeCount: 0,

            /* -----------------------------
               内部：統計再計算
            ----------------------------- */
            _recalc: (todos: Todo[]) => {
                let completed = 0;
                for (const t of todos) {
                    if (t.completed) completed++;
                }

                return {
                    total: todos.length,
                    completedCount: completed,
                    activeCount: todos.length - completed,
                };
            },

            /* -----------------------------
               追加
            ----------------------------- */
            addTodo: (text: string) => {
                const value = text.trim();
                if (!value) return;

                set((state) => {
                    const todos = [
                        {
                            id: crypto.randomUUID(),
                            text: value,
                            completed: false,
                        },
                        ...state.todos,
                    ];

                    return {
                        todos,
                        ...get()._recalc(todos),
                    };
                });
            },

            /* -----------------------------
               Toggle
            ----------------------------- */
            toggleTodo: (id: string) => {
                set((state) => {
                    const todos = state.todos.map((t) =>
                        t.id === id ? { ...t, completed: !t.completed } : t
                    );

                    return {
                        todos,
                        ...get()._recalc(todos),
                    };
                });
            },

            /* -----------------------------
               削除
            ----------------------------- */
            deleteTodo: (id: string) => {
                set((state) => {
                    const todos = state.todos.filter((t) => t.id !== id);

                    return {
                        todos,
                        ...get()._recalc(todos),
                    };
                });
            },

            /* -----------------------------
               完了削除
            ----------------------------- */
            clearCompleted: () => {
                set((state) => {
                    const todos = state.todos.filter((t) => !t.completed);

                    return {
                        todos,
                        ...get()._recalc(todos),
                    };
                });
            },

            /* -----------------------------
               全切替
            ----------------------------- */
            toggleAll: (completed: boolean) => {
                set((state) => {
                    const todos = state.todos.map((t) => ({
                        ...t,
                        completed,
                    }));

                    return {
                        todos,
                        ...get()._recalc(todos),
                    };
                });
            },

            /* -----------------------------
               並び替え
            ----------------------------- */
            reorderTodos: (from: number, to: number) => {
                set((state) => {
                    const todos = [...state.todos];
                    const [moved] = todos.splice(from, 1);
                    todos.splice(to, 0, moved);

                    return { todos };
                });
            },

            /* -----------------------------
               UI state
            ----------------------------- */
            setSearch: (value: string) => set({ search: value }),
            setCategory: (id: string) => set({ activeCategory: id }),
        }),
        {
            name: "todo-storage",
            version: 2,

            /* 🔥 版本迁移 */
            migrate: (persistedState: any, version) => {
                if (version === 1) {
                    return {
                        ...persistedState,
                        todos: persistedState.todos.map((t: any) => ({
                            ...t,
                            id: String(t.id),
                        })),
                    };
                }
                return persistedState;
            },
        }
    )
);