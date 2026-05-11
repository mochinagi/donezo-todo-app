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
    !!todo.dueDate &&
    !todo.completed &&
    !todo.archived &&
    todo.dueDate < now();

const sortTodos = (todos: Todo[]) => {
    return [...todos].sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return Number(b.pinned) - Number(a.pinned);
        }

        const ao = isOverdue(a);
        const bo = isOverdue(b);

        if (ao !== bo) {
            return Number(bo) - Number(ao);
        }

        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        if (a.priority !== b.priority) {
            return priorityRank[b.priority] - priorityRank[a.priority];
        }

        if (a.dueDate && b.dueDate) {
            return a.dueDate - b.dueDate;
        }

        return a.order - b.order;
    });
};

type RemovedItem = {
    todo: Todo;
    index: number;
};

type Action =
    | {
        type: "add";
        todo: Todo;
    }
    | {
        type: "delete";
        removed: RemovedItem[];
    }
    | {
        type: "update";
        id: string;
        before: Partial<Todo>;
        after: Partial<Todo>;
    };

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

const buildStats = (todos: Todo[]) => {
    let completed = 0;
    let archived = 0;
    let overdue = 0;

    for (const todo of todos) {
        if (todo.completed) completed++;
        if (todo.archived) archived++;
        if (isOverdue(todo)) overdue++;
    }

    return {
        total: todos.length,
        completed,
        active: todos.length - completed,
        archived,
        overdue,
    };
};

const withUpdatedAt = <T extends Todo>(
    todo: T,
    patch: Partial<Todo>
): T => {
    return {
        ...todo,
        ...patch,
        updatedAt: now(),
    };
};

const applyHistoryLimit = (stack: Action[]) =>
    stack.slice(-MAX_HISTORY);

const applyState = (
    state: TodoStore,
    todos: Todo[],
    action?: Action
) => {
    return {
        ...state,
        todos,
        undoStack: action
            ? applyHistoryLimit([...state.undoStack, action])
            : state.undoStack,
        redoStack: action ? [] : state.redoStack,
        ...buildStats(todos),
    };
};

const patchTodo = (
    todos: Todo[],
    id: string,
    updater: (todo: Todo) => Todo
) => {
    let before: Todo | null = null;
    let after: Todo | null = null;

    const next = todos.map(todo => {
        if (todo.id !== id) return todo;

        before = todo;
        after = updater(todo);

        return after;
    });

    return {
        next,
        before,
        after,
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

            addTodo: text =>
                set(state => {
                    const value = text.trim();

                    if (!value) {
                        return state;
                    }

                    const normalized = normalizeText(value);

                    const exists = state.todos.some(
                        todo => todo.normalized === normalized
                    );

                    if (exists) {
                        return state;
                    }

                    const timestamp = now();

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
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    };

                    return applyState(
                        state,
                        [todo, ...state.todos],
                        {
                            type: "add",
                            todo,
                        }
                    );
                }),

            updateTodoText: (id, text) =>
                set(state => {
                    const value = text.trim();

                    if (!value) {
                        return state;
                    }

                    const normalized = normalizeText(value);

                    const duplicated = state.todos.some(
                        todo =>
                            todo.id !== id &&
                            todo.normalized === normalized
                    );

                    if (duplicated) {
                        return state;
                    }

                    const { next, before, after } = patchTodo(
                        state.todos,
                        id,
                        todo =>
                            withUpdatedAt(todo, {
                                text: value,
                                normalized,
                            })
                    );

                    if (!before || !after) {
                        return state;
                    }

                    return applyState(state, next, {
                        type: "update",
                        id,
                        before: {
                            text: before.text,
                            normalized: before.normalized,
                        },
                        after: {
                            text: after.text,
                            normalized: after.normalized,
                        },
                    });
                }),

            toggleTodo: id =>
                set(state => {
                    const { next, before, after } = patchTodo(
                        state.todos,
                        id,
                        todo =>
                            withUpdatedAt(todo, {
                                completed: !todo.completed,
                                completedAt: !todo.completed
                                    ? now()
                                    : null,
                            })
                    );

                    if (!before || !after) {
                        return state;
                    }

                    return applyState(state, next, {
                        type: "update",
                        id,
                        before: {
                            completed: before.completed,
                            completedAt: before.completedAt,
                        },
                        after: {
                            completed: after.completed,
                            completedAt: after.completedAt,
                        },
                    });
                }),

            toggleMany: (ids, completed) =>
                set(state => {
                    const setIds = new Set(ids);

                    const next = state.todos.map(todo => {
                        if (!setIds.has(todo.id)) {
                            return todo;
                        }

                        return withUpdatedAt(todo, {
                            completed,
                            completedAt: completed ? now() : null,
                        });
                    });

                    return applyState(state, next);
                }),

            togglePinned: id =>
                set(state => {
                    const next = state.todos.map(todo => {
                        if (todo.id !== id) {
                            return todo;
                        }

                        return withUpdatedAt(todo, {
                            pinned: !todo.pinned,
                        });
                    });

                    return applyState(state, next);
                }),

            archiveMany: (ids, archived) =>
                set(state => {
                    const setIds = new Set(ids);

                    const next = state.todos.map(todo => {
                        if (!setIds.has(todo.id)) {
                            return todo;
                        }

                        return withUpdatedAt(todo, {
                            archived,
                        });
                    });

                    return applyState(state, next);
                }),

            setPriority: (id, priority) =>
                set(state => {
                    const next = state.todos.map(todo => {
                        if (todo.id !== id) {
                            return todo;
                        }

                        return withUpdatedAt(todo, {
                            priority,
                        });
                    });

                    return applyState(state, next);
                }),

            setDueDate: (id, dueDate) =>
                set(state => {
                    const next = state.todos.map(todo => {
                        if (todo.id !== id) {
                            return todo;
                        }

                        return withUpdatedAt(todo, {
                            dueDate,
                        });
                    });

                    return applyState(state, next);
                }),

            reorderTodos: (from, to) =>
                set(state => {
                    const todos = [...state.todos];

                    if (
                        from < 0 ||
                        to < 0 ||
                        from >= todos.length ||
                        to >= todos.length ||
                        from === to
                    ) {
                        return state;
                    }

                    const [moved] = todos.splice(from, 1);

                    todos.splice(to, 0, moved);

                    const next = todos.map((todo, index) => ({
                        ...todo,
                        order: index,
                        updatedAt: now(),
                    }));

                    return applyState(state, next);
                }),

            deleteTodo: id => {
                get().deleteMany([id]);
            },

            deleteMany: ids =>
                set(state => {
                    const setIds = new Set(ids);

                    const removed: RemovedItem[] = [];

                    state.todos.forEach((todo, index) => {
                        if (setIds.has(todo.id)) {
                            removed.push({
                                todo,
                                index,
                            });
                        }
                    });

                    if (!removed.length) {
                        return state;
                    }

                    const next = state.todos.filter(
                        todo => !setIds.has(todo.id)
                    );

                    return applyState(state, next, {
                        type: "delete",
                        removed,
                    });
                }),

            clearCompleted: () => {
                const ids = get()
                    .todos.filter(todo => todo.completed)
                    .map(todo => todo.id);

                get().deleteMany(ids);
            },

            undo: () =>
                set(state => {
                    const action = state.undoStack.at(-1);

                    if (!action) {
                        return state;
                    }

                    let next = state.todos;

                    switch (action.type) {
                        case "add":
                            next = state.todos.filter(
                                todo => todo.id !== action.todo.id
                            );
                            break;

                        case "delete": {
                            const restored = [...state.todos];

                            action.removed
                                .sort((a, b) => a.index - b.index)
                                .forEach(item => {
                                    restored.splice(
                                        item.index,
                                        0,
                                        item.todo
                                    );
                                });

                            next = restored;

                            break;
                        }

                        case "update":
                            next = state.todos.map(todo => {
                                if (todo.id !== action.id) {
                                    return todo;
                                }

                                return {
                                    ...todo,
                                    ...action.before,
                                };
                            });

                            break;
                    }

                    return {
                        ...state,
                        todos: next,
                        undoStack: state.undoStack.slice(0, -1),
                        redoStack: applyHistoryLimit([
                            ...state.redoStack,
                            action,
                        ]),
                        ...buildStats(next),
                    };
                }),

            redo: () =>
                set(state => {
                    const action = state.redoStack.at(-1);

                    if (!action) {
                        return state;
                    }

                    let next = state.todos;

                    switch (action.type) {
                        case "add":
                            next = [action.todo, ...state.todos];
                            break;

                        case "delete": {
                            const ids = new Set(
                                action.removed.map(
                                    item => item.todo.id
                                )
                            );

                            next = state.todos.filter(
                                todo => !ids.has(todo.id)
                            );

                            break;
                        }

                        case "update":
                            next = state.todos.map(todo => {
                                if (todo.id !== action.id) {
                                    return todo;
                                }

                                return {
                                    ...todo,
                                    ...action.after,
                                };
                            });

                            break;
                    }

                    return {
                        ...state,
                        todos: next,
                        redoStack: state.redoStack.slice(0, -1),
                        undoStack: applyHistoryLimit([
                            ...state.undoStack,
                            action,
                        ]),
                        ...buildStats(next),
                    };
                }),

            setSearch: value =>
                set({
                    search: value,
                    searchNormalized: normalizeText(value),
                }),

            setActiveCategory: value =>
                set({
                    activeCategory: value,
                }),

            setHydrated: value =>
                set({
                    hydrated: value,
                }),
        }),
        {
            name: "todo-storage",
            version: 26,
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
            if (
                state.activeCategory !== "archived" &&
                todo.archived
            ) {
                return false;
            }

            if (
                !todo.normalized.includes(
                    state.searchNormalized
                )
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