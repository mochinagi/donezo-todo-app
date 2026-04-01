import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Todo型
 */
export interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

/**
 * Store型
 */
type TodoStore = {
    // state
    todos: Todo[];
    search: string;
    activeCategory: string;

    // actions
    addTodo: (text: string) => void;
    toggleTodo: (id: number) => void;
    deleteTodo: (id: number) => void;

    setSearch: (value: string) => void;
    setCategory: (id: string) => void;

    // derived（面试加分🔥）
    filteredTodos: () => Todo[];
    getCounts: () => {
        total: number;
        completed: number;
        active: number;
    };
};

/**
 * Zustand Store
 */
export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            // state
            todos: [],
            search: "",
            activeCategory: "tasks",

            /**
             * add
             */
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

            /**
             * toggle
             */
            toggleTodo: (id) => {
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id
                            ? { ...t, completed: !t.completed }
                            : t
                    ),
                }));
            },

            /**
             * delete
             */
            deleteTodo: (id) => {
                set((state) => ({
                    todos: state.todos.filter((t) => t.id !== id),
                }));
            },

            /**
             * search
             */
            setSearch: (value) => set({ search: value }),

            /**
             * category
             */
            setCategory: (id) => set({ activeCategory: id }),

            /**
             * filtered todos（核心🔥）
             */
            filteredTodos: () => {
                const { todos, search } = get();

                return todos.filter((t) =>
                    t.text.toLowerCase().includes(search.toLowerCase())
                );
            },

            /**
             * stats
             */
            getCounts: () => {
                const { todos } = get();

                const total = todos.length;
                const completed = todos.filter((t) => t.completed).length;

                return {
                    total,
                    completed,
                    active: total - completed,
                };
            },
        }),
        {
            name: "todo-storage", // localStorage key
        }
    )
);