"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Priority = "low" | "medium" | "high";

export interface Todo {
    id: string;
    text: string;
    normalized: string;
    completed: boolean;
    completedAt?: number | null;
    archived: boolean;
    priority: Priority;
    pinned: boolean;
    order: number;
    dueDate?: number | null;
    createdAt: number;
    updatedAt: number;
}

export type FilterType = "tasks" | "active" | "completed" | "archived";

const MAX_HISTORY = 50;

const now = () => Date.now();

const normalizeText = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

const priorityRank: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
};

const isOverdue = (todo: Todo) =>
    !!todo.dueDate && !todo.completed && todo.dueDate < now();

const sortTodos = (todos: Todo[]) =>
    [...todos].sort((a, b) => {
        if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);

        const ao = isOverdue(a);
        const bo = isOverdue(b);
        if (ao !== bo) return Number(bo) - Number(ao);

        if (a.completed !== b.completed)
            return Number(a.completed) - Number(b.completed);

        if (a.priority !== b.priority)
            return priorityRank[b.priority] - priorityRank[a.priority];

        if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;

        return a.order - b.order;
    });

type RemovedItem = { todo: Todo; index: number };

type Action =
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: RemovedItem[] }
    | { type: "replace"; before: Todo[]; after: Todo[] };

const buildRemoved = (todos: Todo[], ids: string[]): RemovedItem[] => {
    const set = new Set(ids);

    return todos
        .map((t, i) => (set.has(t.id) ? { todo: t, index: i } : null))
        .filter(Boolean) as RemovedItem[];
};

const computeStats = (todos: Todo[]) => ({
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
    archived: todos.filter(t => t.archived).length,
    overdue: todos.filter(isOverdue).length,
});

const updateTodo = (todo: Todo, patch: Partial<Todo>): Todo => ({
    ...todo,
    ...patch,
    updatedAt: now(),
});

type TodoStore = {
    todos: Todo[];
    search: string;
    searchNormalized: string;
    activeCategory: FilterType;
    hydrated: boolean;

    undoStack: Action[];
    redoStack: Action[];

    total: number;
    completed: number;
    active: number;
    archived: number;
    overdue: number;

    addTodo: (text: string) => void;
    updateTodoText: (id: string, text: string) => void;
    toggleTodo: (id: string) => void;
    toggleMany: (ids: string[], completed: boolean) => void;
    togglePinned: (id: string) => void;
    archiveMany: (ids: string[], archived: boolean) => void;
    setPriority: (id: string, priority: Priority) => void;
    setDueDate: (id: string, dueDate: number | null) => void;
    reorderTodos: (from: number, to: number) => void;
    deleteTodo: (id: string) => void;
    deleteMany: (ids: string[]) => void;
    clearCompleted: () => void;
    undo: () => void;
    redo: () => void;
    setSearch: (value: string) => void;
    setActiveCategory: (value: FilterType) => void;
    setHydrated: (value: boolean) => void;
};

const applyHistoryLimit = (arr: Action[]) =>
    arr.slice(-MAX_HISTORY);

const applyState = (
    state: TodoStore,
    nextTodos: Todo[],
    action?: Action
) => {
    const undoStack = action
        ? applyHistoryLimit([...state.undoStack, action])
        : state.undoStack;

    return {
        ...state,
        todos: nextTodos,
        undoStack,
        redoStack: action ? [] : state.redoStack,
        ...computeStats(nextTodos),
    };
};

export const useTodoStore = create<TodoStore>()(
    persist(
        (set, get) => ({
            todos: [],
            search: "",
            searchNormalized: "",
            activeCategory: "tasks",
            hydrated: false,

            undoStack: [],
            redoStack: [],

            total: 0,
            completed: 0,
            active: 0,
            archived: 0,
            overdue: 0,

            addTodo: (text) =>
                set(state => {
                    const value = text.trim();
                    if (!value) return state;

                    const normalized = normalizeText(value);
                    if (state.todos.some(t => t.normalized === normalized)) {
                        return state;
                    }

                    const todo: Todo = {
                        id: crypto.randomUUID(),
                        text: value,
                        normalized,
                        completed: false,
                        completedAt: null,
                        archived: false,
                        priority: "medium",
                        pinned: false,
                        order: state.todos.length,
                        createdAt: now(),
                        updatedAt: now(),
                    };

                    const next = [todo, ...state.todos];

                    return applyState(state, next, { type: "add", todo });
                }),

            updateTodoText: (id, text) =>
                set(state => {
                    const value = text.trim();
                    if (!value) return state;

                    const normalized = normalizeText(value);

                    const next = state.todos.map(t =>
                        t.id === id
                            ? updateTodo(t, { text: value, normalized })
                            : t
                    );

                    return applyState(state, next, {
                        type: "replace",
                        before: state.todos,
                        after: next,
                    });
                }),

            toggleTodo: (id) =>
                set(state => {
                    const next = state.todos.map(t =>
                        t.id === id
                            ? updateTodo(t, {
                                completed: !t.completed,
                                completedAt: !t.completed ? now() : null,
                            })
                            : t
                    );

                    return applyState(state, next, {
                        type: "replace",
                        before: state.todos,
                        after: next,
                    });
                }),

            toggleMany: (ids, completed) =>
                set(state => {
                    const setIds = new Set(ids);

                    const next = state.todos.map(t =>
                        setIds.has(t.id)
                            ? updateTodo(t, {
                                completed,
                                completedAt: completed ? now() : null,
                            })
                            : t
                    );

                    return applyState(state, next, {
                        type: "replace",
                        before: state.todos,
                        after: next,
                    });
                }),

            togglePinned: (id) =>
                set(state => {
                    const next = state.todos.map(t =>
                        t.id === id
                            ? updateTodo(t, { pinned: !t.pinned })
                            : t
                    );

                    return applyState(state, next, {
                        type: "replace",
                        before: state.todos,
                        after: next,
                    });
                }),

            archiveMany: (ids, archived) =>
                set(state => {
                    const setIds = new Set(ids);

                    const next = state.todos.map(t =>
                        setIds.has(t.id)
                            ? updateTodo(t, { archived })
                            : t
                    );

                    return applyState(state, next, {
                        type: "replace",
                        before: state.todos,
                        after: next,
                    });
                }),

            setPriority: (id, priority) =>
                set(state => {
                    const next = state.todos.map(t =>
                        t.id === id ? updateTodo(t, { priority }) : t
                    );

                    return applyState(state, next, {
                        type: "replace",
                        before: state.todos,
                        after: next,
                    });
                }),

            setDueDate: (id, dueDate) =>
                set(state => {
                    const next = state.todos.map(t =>
                        t.id === id ? updateTodo(t, { dueDate }) : t
                    );

                    return applyState(state, next, {
                        type: "replace",
                        before: state.todos,
                        after: next,
                    });
                }),

            reorderTodos: (from, to) =>
                set(state => {
                    const list = [...state.todos];
                    if (
                        from < 0 ||
                        to < 0 ||
                        from >= list.length ||
                        to >= list.length ||
                        from === to
                    ) {
                        return state;
                    }

                    const [moved] = list.splice(from, 1);
                    list.splice(to, 0, moved);

                    const next = list.map((t, i) => ({
                        ...t,
                        order: i,
                    }));

                    return applyState(state, next, {
                        type: "replace",
                        before: state.todos,
                        after: next,
                    });
                }),

            deleteTodo: (id) => get().deleteMany([id]),

            deleteMany: (ids) =>
                set(state => {
                    const removed = buildRemoved(state.todos, ids);
                    if (!removed.length) return state;

                    const setIds = new Set(ids);
                    const next = state.todos.filter(t => !setIds.has(t.id));

                    return applyState(state, next, {
                        type: "delete",
                        removed,
                    });
                }),

            clearCompleted: () => {
                const ids = get().todos.filter(t => t.completed).map(t => t.id);
                get().deleteMany(ids);
            },

            undo: () =>
                set(state => {
                    const action = state.undoStack.at(-1);
                    if (!action) return state;

                    let next: Todo[];

                    if (action.type === "add") {
                        next = state.todos.filter(t => t.id !== action.todo.id);
                    } else if (action.type === "delete") {
                        const arr = [...state.todos];
                        [...action.removed]
                            .sort((a, b) => a.index - b.index)
                            .forEach(({ todo, index }) => {
                                arr.splice(index, 0, todo);
                            });
                        next = arr;
                    } else {
                        next = action.before;
                    }

                    return {
                        ...state,
                        todos: next,
                        undoStack: state.undoStack.slice(0, -1),
                        redoStack: applyHistoryLimit([...state.redoStack, action]),
                        ...computeStats(next),
                    };
                }),

            redo: () =>
                set(state => {
                    const action = state.redoStack.at(-1);
                    if (!action) return state;

                    let next: Todo[];

                    if (action.type === "add") {
                        next = [action.todo, ...state.todos];
                    } else if (action.type === "delete") {
                        const ids = new Set(action.removed.map(r => r.todo.id));
                        next = state.todos.filter(t => !ids.has(t.id));
                    } else {
                        next = action.after;
                    }

                    return {
                        ...state,
                        todos: next,
                        redoStack: state.redoStack.slice(0, -1),
                        undoStack: applyHistoryLimit([...state.undoStack, action]),
                        ...computeStats(next),
                    };
                }),

            setSearch: (value) =>
                set({
                    search: value,
                    searchNormalized: normalizeText(value),
                }),

            setActiveCategory: (value) => set({ activeCategory: value }),

            setHydrated: (value) => set({ hydrated: value }),
        }),
        {
            name: "todo-storage",
            version: 25,
            storage: createJSONStorage(() => localStorage),
            partialize: state => ({
                todos: state.todos,
                activeCategory: state.activeCategory,
            }),
            onRehydrateStorage: () => state => {
                state?.setHydrated(true);
            },
        }
    )
);

export const useFilteredTodos = () =>
    useTodoStore(state => {
        const filtered = state.todos.filter(todo => {
            if (todo.archived && state.activeCategory !== "archived") {
                return false;
            }

            if (
                !todo.normalized.includes(state.searchNormalized)
            ) {
                return false;
            }

            switch (state.activeCategory) {
                case "active":
                    return !todo.completed;
                case "completed":
                    return todo.completed;
                case "archived":
                    return todo.archived;
                default:
                    return true;
            }
        });

        return sortTodos(filtered);
    });