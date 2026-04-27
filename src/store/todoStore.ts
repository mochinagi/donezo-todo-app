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

type Action =
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: { todo: Todo; index: number }[] }
    | { type: "update"; before: Todo; after: Todo }
    | { type: "toggle"; before: Todo; after: Todo }
    | { type: "toggleAll"; before: Todo[]; after: Todo[] }
    | { type: "reorder"; from: number; to: number }
    | { type: "clearCompleted"; removed: { todo: Todo; index: number }[] };

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

const apply = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete":
        case "clearCompleted": {
            const ids = new Set(action.removed.map(r => r.todo.id));
            return todos.filter(t => !ids.has(t.id));
        }

        case "update":
        case "toggle":
            return todos.map(t =>
                t.id === action.after.id ? action.after : t
            );

        case "toggleAll":
            return action.after;

        case "reorder": {
            const arr = [...todos];
            const [moved] = arr.splice(action.from, 1);
            arr.splice(action.to, 0, moved);
            return arr;
        }

        default:
            return todos;
    }
};

const revert = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return todos.filter(t => t.id !== action.todo.id);

        case "delete":
        case "clearCompleted": {
            const arr = [...todos];
            action.removed.forEach(({ todo, index }) => {
                arr.splice(index, 0, todo);
            });
            return arr;
        }

        case "update":
        case "toggle":
            return todos.map(t =>
                t.id === action.before.id ? action.before : t
            );

        case "toggleAll":
            return action.before;

        case "reorder": {
            const arr = [...todos];
            const [moved] = arr.splice(action.to, 1);
            arr.splice(action.from, 0, moved);
            return arr;
        }

        default:
            return todos;
    }
};

/* ================= STORE ================= */

type TodoStore = {
    todos: Todo[];
    search: string;
    activeCategory: FilterType;

    undoStack: Action[];
    redoStack: Action[];

    dispatch: (action: Action) => void;

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

            dispatch: (action) => {
                set((state) => ({
                    todos: apply(state.todos, action),
                    undoStack: [...state.undoStack, action],
                    redoStack: [],
                }));
            },

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

                get().dispatch({ type: "add", todo });
            },

            updateTodo: (id, text) => {
                const t = get().todos.find(t => t.id === id);
                if (!t) return;

                const next = {
                    ...t,
                    text: text.trim(),
                    updatedAt: Date.now(),
                };

                get().dispatch({
                    type: "update",
                    before: t,
                    after: next,
                });
            },

            toggleTodo: (id) => {
                const t = get().todos.find(t => t.id === id);
                if (!t) return;

                const next = {
                    ...t,
                    completed: !t.completed,
                    updatedAt: Date.now(),
                };

                get().dispatch({
                    type: "toggle",
                    before: t,
                    after: next,
                });
            },

            toggleAll: () => {
                const { todos } = get();
                const allDone = todos.every(t => t.completed);

                const next = todos.map(t => ({
                    ...t,
                    completed: !allDone,
                    updatedAt: Date.now(),
                }));

                get().dispatch({
                    type: "toggleAll",
                    before: todos,
                    after: next,
                });
            },

            deleteTodo: (id) => {
                const { todos } = get();
                const index = todos.findIndex(t => t.id === id);
                if (index === -1) return;

                get().dispatch({
                    type: "delete",
                    removed: [{ todo: todos[index], index }],
                });
            },

            deleteMany: (ids) => {
                const { todos } = get();
                const idSet = new Set(ids);

                const removed: { todo: Todo; index: number }[] = [];

                todos.forEach((t, i) => {
                    if (idSet.has(t.id)) {
                        removed.push({ todo: t, index: i });
                    }
                });

                if (removed.length) {
                    get().dispatch({ type: "delete", removed });
                }
            },

            clearCompleted: () => {
                const { todos } = get();

                const removed: { todo: Todo; index: number }[] = [];

                todos.forEach((t, i) => {
                    if (t.completed) {
                        removed.push({ todo: t, index: i });
                    }
                });

                if (removed.length) {
                    get().dispatch({ type: "clearCompleted", removed });
                }
            },

            reorderTodos: (from, to) => {
                get().dispatch({ type: "reorder", from, to });
            },

            undo: () => {
                const { undoStack, todos } = get();
                const action = undoStack.at(-1);
                if (!action) return;

                set((state) => ({
                    todos: revert(todos, action),
                    undoStack: state.undoStack.slice(0, -1),
                    redoStack: [...state.redoStack, action],
                }));
            },

            redo: () => {
                const { redoStack, todos } = get();
                const action = redoStack.at(-1);
                if (!action) return;

                set((state) => ({
                    todos: apply(todos, action),
                    redoStack: state.redoStack.slice(0, -1),
                    undoStack: [...state.undoStack, action],
                }));
            },

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
            version: 15,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                todos: state.todos,
                search: state.search,
                activeCategory: state.activeCategory,
            }),
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