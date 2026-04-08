import { create } from "zustand";
import { persist } from "zustand/middleware";

/* -----------------------------
   Todo型定義
----------------------------- */
export interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

/* -----------------------------
   フィルタタイプ
----------------------------- */
export type FilterType = "all" | "completed" | "active";

/* -----------------------------
   Store型定義
----------------------------- */
type TodoStore = {
    todos: Todo[];
    search: string;
    activeCategory: string;

    addTodo: (text: string) => void;
    toggleTodo: (id: number) => void;
    deleteTodo: (id: number) => void;
    clearCompleted: () => void;
    toggleAll: (completed: boolean) => void;
    reorderTodos: (startIndex: number, endIndex: number) => void;

    setSearch: (value: string) => void;
    setCategory: (id: string) => void;

    filteredTodos: (filter?: FilterType) => Todo[];
    filteredTodosByCategory: () => Todo[];
    getCounts: () => { total: number; completed: number; active: number };
};

/* -----------------------------
   Zustand Store
----------------------------- */
export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            todos: [],
            search: "",
            activeCategory: "tasks",

            /* -----------------------------
               タスク追加
            ----------------------------- */
            addTodo: (text: string) => {
                const value = text.trim();
                if (!value) return;

                set((state) => ({
                    todos: [
                        {
                            id: Date.now(),
                            text: value,
                            completed: false,
                        },
                        ...state.todos,
                    ],
                }));
            },

            /* -----------------------------
               タスク完了切替
            ----------------------------- */
            toggleTodo: (id: number) => {
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id ? { ...t, completed: !t.completed } : t
                    ),
                }));
            },

            /* -----------------------------
               タスク削除
            ----------------------------- */
            deleteTodo: (id: number) => {
                set((state) => ({
                    todos: state.todos.filter((t) => t.id !== id),
                }));
            },

            /* -----------------------------
               完了タスク一括削除
            ----------------------------- */
            clearCompleted: () => {
                set((state) => ({
                    todos: state.todos.filter((t) => !t.completed),
                }));
            },

            /* -----------------------------
               全タスク完了切替
            ----------------------------- */
            toggleAll: (completed: boolean) => {
                set((state) => ({
                    todos: state.todos.map((t) => ({ ...t, completed })),
                }));
            },

            /* -----------------------------
               タスク並び替え (ドラッグ＆ドロップ用)
            ----------------------------- */
            reorderTodos: (startIndex: number, endIndex: number) => {
                set((state) => {
                    const todos = [...state.todos];
                    const [moved] = todos.splice(startIndex, 1);
                    todos.splice(endIndex, 0, moved);
                    return { todos };
                });
            },

            /* -----------------------------
               検索
            ----------------------------- */
            setSearch: (value: string) => set({ search: value }),

            /* -----------------------------
               カテゴリ設定
            ----------------------------- */
            setCategory: (id: string) => set({ activeCategory: id }),

            /* -----------------------------
               タスクフィルタリング
            ----------------------------- */
            filteredTodos: (filter: FilterType = "all") => {
                const { todos, search } = get();
                const searchLower = search.toLowerCase();

                let result = todos.filter((t) =>
                    t.text.toLowerCase().includes(searchLower)
                );

                if (filter === "completed") result = result.filter((t) => t.completed);
                if (filter === "active") result = result.filter((t) => !t.completed);

                return result;
            },

            /* -----------------------------
               カテゴリ別フィルタ
            ----------------------------- */
            filteredTodosByCategory: () => {
                const { todos, activeCategory } = get();
                if (activeCategory === "tasks") return todos;
                if (activeCategory === "completed") return todos.filter((t) => t.completed);
                if (activeCategory === "active") return todos.filter((t) => !t.completed);
                return todos;
            },

            /* -----------------------------
               統計取得
            ----------------------------- */
            getCounts: () => {
                const { todos } = get();
                return todos.reduce(
                    (acc, todo) => {
                        acc.total += 1;
                        if (todo.completed) acc.completed += 1;
                        else acc.active += 1;
                        return acc;
                    },
                    { total: 0, completed: 0, active: 0 }
                );
            },
        }),
        {
            name: "todo-storage", // localStorage key
            version: 1,
        }
    )
);