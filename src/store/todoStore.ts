import { create } from "zustand";

export interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

type TodoStore = {
    todos: Todo[];
    search: string;
    activeCategory: string;

    addTodo: (text: string) => void;
    toggleTodo: (id: number) => void;
    deleteTodo: (id: number) => void;

    setSearch: (value: string) => void;
    setCategory: (id: string) => void;
};

export const useTodoStore = create<TodoStore>((set) => ({
    todos: [],
    search: "",
    activeCategory: "tasks",

    addTodo: (text) =>
        set((state) => ({
            todos: [
                { id: Date.now(), text, completed: false },
                ...state.todos,
            ],
        })),

    toggleTodo: (id) =>
        set((state) => ({
            todos: state.todos.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t
            ),
        })),

    deleteTodo: (id) =>
        set((state) => ({
            todos: state.todos.filter((t) => t.id !== id),
        })),

    setSearch: (value) => set({ search: value }),
    setCategory: (id) => set({ activeCategory: id }),
}));