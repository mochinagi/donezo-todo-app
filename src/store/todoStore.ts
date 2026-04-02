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
    // state
    todos: Todo[];
    search: string;
    activeCategory: string;

    // actions
    addTodo: (text: string) => void;
    toggleTodo: (id: number) => void;
    deleteTodo: (id: number) => void;
    clearCompleted: () => void;

    setSearch: (value: string) => void;
    setCategory: (id: string) => void;

    // derived
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
            // state
            todos: [],
            search: "",
            activeCategory: "tasks",

            /* -----------------------------
               タスク追加
            ----------------------------- */
            addTodo: (text) => {
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
            toggleTodo: (id) => {
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id ? { ...t, completed: !t.completed } : t
                    ),
                }));
            },

            /* -----------------------------
               タスク削除
            ----------------------------- */
            deleteTodo: (id) => {
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
               検索
            ----------------------------- */
            setSearch: (value) => set({ search: value }),

            /* -----------------------------
               カテゴリ設定
            ----------------------------- */
            setCategory: (id) => set({ activeCategory: id }),

            /* -----------------------------
               タスクフィルタリング
               filter: all | completed | active
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
        }
    )
);