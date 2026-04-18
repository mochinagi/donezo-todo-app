"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";

/* ================= TYPES ================= */

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

export type FilterType = "tasks" | "completed" | "active";

type UndoAction =
    | { type: "delete"; payload: { todo: Todo; index: number } }
    | { type: "add"; payload: { id: string } }
    | { type: "toggle"; payload: { prev: Todo } }
    | { type: "edit"; payload: { prev: Todo } }
    | { type: "reorder"; payload: { from: number; to: number } };

const MAX_UNDO = 50;

/* ================= UTILS ================= */

const pushUndo = (stack: UndoAction[], action: UndoAction) => {
    const next = [...stack, action];
    if (next.length > MAX_UNDO) next.shift();
    return next;
};

/* ================= STORE ================= */

type TodoStore = {
    todos: Todo[];
    search: string;
    activeCategory: FilterType;

    undoStack: UndoAction[];
    redoStack: UndoAction[];

    addTodo: (text: string) => void;
    updateTodo: (id: string, text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompleted: () => void;

    undo: () => void;
    redo: () => void;

    reorderTodos: (from: number, to: number) => void;

    setSearch: (value: string) => void;
    setActiveCategory: (id: FilterType) => void;
};

export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            todos: [],
            search: "",
            activeCategory: "tasks",

            undoStack: [],
            redoStack: [],

            /* ---------------- ADD ---------------- */
            addTodo: (text) => {
                const value = text.trim();
                if (!value) return;

                const id = crypto.randomUUID();

                set((state) => {
                    if (
                        state.todos.some(
                            (t) =>
                                t.text.toLowerCase() === value.toLowerCase()
                        )
                    ) return state;

                    return {
                        todos: [
                            { id, text: value, completed: false },
                            ...state.todos,
                        ],
                        undoStack: pushUndo(state.undoStack, {
                            type: "add",
                            payload: { id },
                        }),
                        redoStack: [],
                    };
                });
            },

            /* ---------------- EDIT ---------------- */
            updateTodo: (id, text) => {
                const value = text.trim();
                if (!value) return;

                set((state) => {
                    const prev = state.todos.find((t) => t.id === id);
                    if (!prev || prev.text === value) return state;

                    return {
                        todos: state.todos.map((t) =>
                            t.id === id ? { ...t, text: value } : t
                        ),
                        undoStack: pushUndo(state.undoStack, {
                            type: "edit",
                            payload: { prev },
                        }),
                        redoStack: [],
                    };
                });
            },

            /* ---------------- TOGGLE ---------------- */
            toggleTodo: (id) => {
                set((state) => {
                    const prev = state.todos.find((t) => t.id === id);
                    if (!prev) return state;

                    return {
                        todos: state.todos.map((t) =>
                            t.id === id
                                ? { ...t, completed: !t.completed }
                                : t
                        ),
                        undoStack: pushUndo(state.undoStack, {
                            type: "toggle",
                            payload: { prev },
                        }),
                        redoStack: [],
                    };
                });
            },

            /* ---------------- DELETE ---------------- */
            deleteTodo: (id) => {
                set((state) => {
                    const index = state.todos.findIndex((t) => t.id === id);
                    if (index === -1) return state;

                    return {
                        todos: state.todos.filter((t) => t.id !== id),
                        undoStack: pushUndo(state.undoStack, {
                            type: "delete",
                            payload: {
                                todo: state.todos[index],
                                index,
                            },
                        }),
                        redoStack: [],
                    };
                });
            },

            /* ---------------- CLEAR ---------------- */
            clearCompleted: () =>
                set((state) => ({
                    todos: state.todos.filter((t) => !t.completed),
                    redoStack: [],
                })),

            /* ---------------- UNDO ---------------- */
            undo: () => {
                const action = get().undoStack.at(-1);
                if (!action) return;

                set((state) => {
                    const undoStack = state.undoStack.slice(0, -1);

                    switch (action.type) {
                        case "add":
                            return {
                                todos: state.todos.filter(
                                    (t) => t.id !== action.payload.id
                                ),
                                undoStack,
                                redoStack: pushUndo(state.redoStack, action),
                            };

                        case "delete": {
                            const updated = [...state.todos];
                            updated.splice(
                                action.payload.index,
                                0,
                                action.payload.todo
                            );
                            return {
                                todos: updated,
                                undoStack,
                                redoStack: pushUndo(state.redoStack, action),
                            };
                        }

                        case "toggle":
                        case "edit":
                            return {
                                todos: state.todos.map((t) =>
                                    t.id === action.payload.prev.id
                                        ? action.payload.prev
                                        : t
                                ),
                                undoStack,
                                redoStack: pushUndo(state.redoStack, action),
                            };

                        case "reorder": {
                            const updated = [...state.todos];
                            const [moved] = updated.splice(action.payload.to, 1);
                            updated.splice(action.payload.from, 0, moved);

                            return {
                                todos: updated,
                                undoStack,
                                redoStack: pushUndo(state.redoStack, action),
                            };
                        }

                        default:
                            return state;
                    }
                });
            },

            /* ---------------- REDO ---------------- */
            redo: () => {
                const action = get().redoStack.at(-1);
                if (!action) return;

                set((state) => {
                    const redoStack = state.redoStack.slice(0, -1);

                    switch (action.type) {
                        case "add":
                            return {
                                todos: [
                                    {
                                        id: action.payload.id,
                                        text: "",
                                        completed: false,
                                    },
                                    ...state.todos,
                                ],
                                redoStack,
                            };

                        default:
                            return state;
                    }
                });
            },

            /* ---------------- REORDER ---------------- */
            reorderTodos: (from, to) =>
                set((state) => {
                    if (from === to) return state;

                    const todos = [...state.todos];
                    const [moved] = todos.splice(from, 1);
                    todos.splice(to, 0, moved);

                    return {
                        todos,
                        undoStack: pushUndo(state.undoStack, {
                            type: "reorder",
                            payload: { from, to },
                        }),
                        redoStack: [],
                    };
                }),

            setSearch: (value) => set({ search: value }),
            setActiveCategory: (id) =>
                set({ activeCategory: id }),
        }),
        {
            name: "todo-storage",
            version: 8,
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                todos: state.todos,
                search: state.search,
                activeCategory: state.activeCategory,
            }),
        }
    )
);

/* ================= SELECTORS ================= */

export const useFilteredTodos = () =>
    useTodoStore(
        (state) => {
            const keyword = state.search.toLowerCase();

            return state.todos.filter((t) => {
                if (!t.text.toLowerCase().includes(keyword)) return false;

                if (state.activeCategory === "active") return !t.completed;
                if (state.activeCategory === "completed") return t.completed;

                return true;
            });
        },
        shallow
    );

export const useTodoStats = () =>
    useTodoStore(
        (state) => {
            const completed = state.todos.filter((t) => t.completed).length;
            const total = state.todos.length;

            return {
                total,
                completed,
                active: total - completed,
                completionRate:
                    total === 0 ? 0 : Math.round((completed / total) * 100),
            };
        },
        shallow
    );