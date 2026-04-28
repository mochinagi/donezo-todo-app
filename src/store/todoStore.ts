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

/* ================= LIMIT ================= */

const MAX_HISTORY = 50;

/* ================= ACTION ================= */

type ActionMeta = {
    at: number;
    silent?: boolean;
};

type Action =
    | { type: "add"; todo: Todo; meta: ActionMeta }
    | { type: "delete"; removed: { todo: Todo; index: number }[]; meta: ActionMeta }
    | { type: "update"; before: Todo; after: Todo; meta: ActionMeta }
    | { type: "toggle"; before: Todo; after: Todo; meta: ActionMeta }
    | { type: "toggleAll"; before: Todo[]; after: Todo[]; meta: ActionMeta }
    | { type: "reorder"; from: number; to: number; meta: ActionMeta }
    | { type: "clearCompleted"; removed: { todo: Todo; index: number }[]; meta: ActionMeta };

/* ================= UTILS ================= */

const withMeta = <T extends Omit<Action, "meta">>(
    action: T,
    meta?: Partial<ActionMeta>
): Action => ({
    ...action,
    meta: {
        at: Date.now(),
        ...meta,
    },
});

const sortTodos = (todos: Todo[]) => {
    return [...todos].sort((a, b) => b.createdAt - a.createdAt);
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
            if (
                action.from < 0 ||
                action.to < 0 ||
                action.from >= todos.length ||
                action.to >= todos.length
            ) return todos;

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

const buildRemoved = (todos: Todo[], ids: string[]) => {
    const set = new Set(ids);
    return todos
        .map((t, i) => (set.has(t.id) ? { todo: t, index: i } : null))
        .filter(Boolean) as { todo: Todo; index: number }[];
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
                set((state) => {
                    const nextTodos = apply(state.todos, action);

                    if (action.meta?.silent) {
                        return { todos: nextTodos };
                    }

                    const nextUndo = [...state.undoStack, action].slice(-MAX_HISTORY);

                    return {
                        todos: nextTodos,
                        undoStack: nextUndo,
                        redoStack: [],
                    };
                });
            },

            addTodo: (text) => {
                const value = text.trim();
                if (!value) return;

                const exists = get().todos.some(t => t.text === value);
                if (exists) return;

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

                get().dispatch(withMeta({ type: "add", todo }));
            },

            updateTodo: (id, text) => {
                const value = text.trim();
                if (!value) return;

                const t = get().todos.find(t => t.id === id);
                if (!t) return;

                const next = {
                    ...t,
                    text: value,
                    updatedAt: Date.now(),
                };

                get().dispatch(withMeta({
                    type: "update",
                    before: t,
                    after: next,
                }));
            },

            toggleTodo: (id) => {
                const t = get().todos.find(t => t.id === id);
                if (!t) return;

                const next = {
                    ...t,
                    completed: !t.completed,
                    updatedAt: Date.now(),
                };

                get().dispatch(withMeta({
                    type: "toggle",
                    before: t,
                    after: next,
                }));
            },

            toggleAll: () => {
                const { todos } = get();
                const allDone = todos.every(t => t.completed);

                const next = todos.map(t => ({
                    ...t,
                    completed: !allDone,
                    updatedAt: Date.now(),
                }));

                get().dispatch(withMeta({
                    type: "toggleAll",
                    before: todos,
                    after: next,
                }));
            },

            deleteTodo: (id) => {
                const removed = buildRemoved(get().todos, [id]);
                if (!removed.length) return;

                get().dispatch(withMeta({ type: "delete", removed }));
            },

            deleteMany: (ids) => {
                const removed = buildRemoved(get().todos, ids);
                if (!removed.length) return;

                get().dispatch(withMeta({ type: "delete", removed }));
            },

            clearCompleted: () => {
                const todos = get().todos;
                const ids = todos.filter(t => t.completed).map(t => t.id);
                const removed = buildRemoved(todos, ids);

                if (!removed.length) return;

                get().dispatch(withMeta({
                    type: "clearCompleted",
                    removed,
                }));
            },

            reorderTodos: (from, to) => {
                get().dispatch(withMeta({ type: "reorder", from, to }));
            },

            undo: () => {
                const { undoStack, todos } = get();
                const action = undoStack.at(-1);
                if (!action) return;

                set((state) => ({
                    todos: revert(todos, action),
                    undoStack: state.undoStack.slice(0, -1),
                    redoStack: [...state.redoStack, action].slice(-MAX_HISTORY),
                }));
            },

            redo: () => {
                const { redoStack, todos } = get();
                const action = redoStack.at(-1);
                if (!action) return;

                set((state) => ({
                    todos: apply(todos, action),
                    redoStack: state.redoStack.slice(0, -1),
                    undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
                }));
            },

            setSearch: (v) =>
                set({ search: v.trim().toLowerCase() }),

            setActiveCategory: (v) =>
                set({ activeCategory: v }),

            getSortedTodos: () => sortTodos(get().todos),
        }),
        {
            name: "todo-storage",
            version: 17,
            storage: createJSONStorage(() => localStorage),
            migrate: (state: any) => {
                if (!state?.todos) return state;
                return {
                    ...state,
                    todos: state.todos.map((t: any) => ({
                        ...t,
                        createdAt: t.createdAt ?? Date.now(),
                        updatedAt: t.updatedAt ?? Date.now(),
                    })),
                };
            },
        }
    )
);

/* ================= SELECTOR ================= */

export const useFilteredTodos = () =>
    useTodoStore(
        (s) => {
            return sortTodos(s.todos).filter((t) => {
                if (!t.text.toLowerCase().includes(s.search)) return false;

                if (s.activeCategory === "active") return !t.completed;
                if (s.activeCategory === "completed") return t.completed;

                return true;
            });
        },
        shallow
    );