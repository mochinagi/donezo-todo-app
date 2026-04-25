"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";

/* ================= TYPES ================= */

export type Priority = "low" | "medium" | "high";

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    priority: Priority;
    pinned: boolean;
    createdAt: number;
    updatedAt: number;
}

export type FilterType = "tasks" | "completed" | "active";

/* ================= UTILS ================= */

const priorityWeight: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
};

const sortTodos = (todos: Todo[]) => {
    return [...todos].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        }

        return b.createdAt - a.createdAt;
    });
};

/* ================= STORE ================= */

type TodoStore = {
    todos: Todo[];
    search: string;
    activeCategory: FilterType;

    undoStack: any[];
    redoStack: any[];

    addTodo: (text: string) => void;
    updateTodo: (id: string, text: string) => void;
    toggleTodo: (id: string) => void;
    toggleAll: () => void;
    deleteTodo: (id: string) => void;
    deleteMany: (ids: string[]) => void;
    clearCompleted: () => void;

    undo: () => void;
    redo: () => void;

    reorderTodos: (from: number, to: number) => void;

    setSearch: (v: string) => void;
    setActiveCategory: (v: FilterType) => void;

    getSortedTodos: () => Todo[];
};

export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            todos: [],
            search: "",
            activeCategory: "tasks",

            undoStack: [],
            redoStack: [],

            addTodo: (text) => {
                const value = text.trim();
                if (!value) return;

                const now = Date.now();

                const todo: Todo = {
                    id: crypto.randomUUID(),
                    text: value,
                    completed: false,
                    priority: "medium",
                    pinned: false,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    todos: [todo, ...state.todos],
                    undoStack: [...state.undoStack, { type: "add", todo }],
                    redoStack: [],
                }));
            },

            updateTodo: (id, text) =>
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id
                            ? { ...t, text: text.trim(), updatedAt: Date.now() }
                            : t
                    ),
                })),

            toggleTodo: (id) =>
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id
                            ? { ...t, completed: !t.completed, updatedAt: Date.now() }
                            : t
                    ),
                })),

            toggleAll: () =>
                set((state) => {
                    const allDone = state.todos.every(t => t.completed);
                    return {
                        todos: state.todos.map(t => ({
                            ...t,
                            completed: !allDone,
                            updatedAt: Date.now(),
                        })),
                    };
                }),

            deleteTodo: (id) =>
                set((state) => ({
                    todos: state.todos.filter(t => t.id !== id),
                })),

            deleteMany: (ids) =>
                set((state) => {
                    const idSet = new Set(ids);
                    return {
                        todos: state.todos.filter(t => !idSet.has(t.id)),
                    };
                }),

            clearCompleted: () =>
                set((state) => ({
                    todos: state.todos.filter(t => !t.completed),
                })),

            undo: () => { },
            redo: () => { },

            reorderTodos: (from, to) =>
                set((state) => {
                    const arr = [...state.todos];
                    const [moved] = arr.splice(from, 1);
                    arr.splice(to, 0, moved);
                    return { todos: arr };
                }),

            setSearch: (v) =>
                set({ search: v.trim().toLowerCase() }),

            setActiveCategory: (v) =>
                set({ activeCategory: v }),

            getSortedTodos: () => {
                const { todos } = get();
                return sortTodos(todos);
            },
        }),
        {
            name: "todo-storage",
            version: 14,
            storage: createJSONStorage(() => localStorage),
        }
    )
);

/* ================= SELECTOR ================= */

export const useFilteredTodos = () =>
    useTodoStore(
        (s) => {
            const list = sortTodos(s.todos);

            return list.filter((t) => {
                if (!t.text.toLowerCase().includes(s.search)) return false;

                if (s.activeCategory === "active") return !t.completed;
                if (s.activeCategory === "completed") return t.completed;

                return true;
            });
        },
        shallow
    );