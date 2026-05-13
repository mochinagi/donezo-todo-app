"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Priority = "low" | "medium" | "high";

export interface Todo {
    id: string;
    text: string;
    normalized: string;

    completed: boolean;
    completedAt: number | null;

    archived: boolean;

    priority: Priority;
    pinned: boolean;

    order: number;

    dueDate: number | null;

    createdAt: number;
    updatedAt: number;
}

export type FilterType = "tasks" | "active" | "completed" | "archived";

type RemovedTodo = {
    todo: Todo;
    index: number;
};

type FieldPatch = Partial<Todo>;

type BulkUpdateItem = {
    id: string;
    before: FieldPatch;
    after: FieldPatch;
};

type HistoryAction =
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: RemovedTodo[] }
    | { type: "update"; id: string; before: FieldPatch; after: FieldPatch }
    | { type: "bulkUpdate"; updates: BulkUpdateItem[] };

type TodoStore = {
    todos: Todo[];

    search: string;
    searchNormalized: string;

    activeCategory: FilterType;

    hydrated: boolean;

    undoStack: HistoryAction[];
    redoStack: HistoryAction[];

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

const HISTORY_LIMIT = 50;

const now = () => Date.now();

const normalizeText = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

const priorityWeight: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
};

const isOverdue = (todo: Todo) =>
    !!todo.dueDate && !todo.completed && !todo.archived && todo.dueDate < now();

const isStale = (todo: Todo) =>
    !todo.completed && !todo.archived && now() - todo.updatedAt > 1000 * 60 * 60 * 24 * 7;

const sortTodos = (todos: Todo[]) =>
    [...todos].sort((a, b) => {
        if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);

        const ao = isOverdue(a);
        const bo = isOverdue(b);
        if (ao !== bo) return Number(bo) - Number(ao);

        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);

        if (a.priority !== b.priority) {
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        }

        if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;

        return a.order - b.order;
    });

const limitHistory = (stack: HistoryAction[]) => stack.slice(-HISTORY_LIMIT);

const reorderIndexes = (todos: Todo[]) =>
    todos.map((t, i) => ({ ...t, order: i }));

const touchTodo = (todo: Todo, patch: Partial<Todo>): Todo => ({
    ...todo,
    ...patch,
    updatedAt: now(),
});

const buildBulkUpdate = (
    ids: string[],
    beforeMap: Map<string, Todo>,
    afterMap: Map<string, Todo>
): BulkUpdateItem[] =>
    ids
        .map(id => {
            const b = beforeMap.get(id);
            const a = afterMap.get(id);
            if (!b || !a) return null;

            const before: FieldPatch = {};
            const after: FieldPatch = {};

            (Object.keys(a) as (keyof Todo)[]).forEach(k => {
                if (b[k] !== a[k]) {
                    before[k] = b[k] as any;
                    after[k] = a[k] as any;
                }
            });

            return { id, before, after };
        })
        .filter(Boolean) as BulkUpdateItem[];

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

            addTodo: text =>
                set(state => {
                    const value = text.trim();
                    if (!value) return state;

                    const normalized = normalizeText(value);
                    if (state.todos.some(t => t.normalized === normalized)) return state;

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
                        order: 0,
                        dueDate: null,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    };

                    const next = reorderIndexes([todo, ...state.todos]);

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([...state.undoStack, { type: "add", todo }]),
                        redoStack: [],
                    };
                }),

            updateTodoText: (id, text) =>
                set(state => {
                    const value = text.trim();
                    if (!value) return state;

                    const normalized = normalizeText(value);

                    let before: Todo | null = null;
                    let after: Todo | null = null;

                    const next = state.todos.map(t => {
                        if (t.id !== id) return t;
                        before = t;
                        after = touchTodo(t, { text: value, normalized });
                        return after;
                    });

                    if (!before || !after) return state;

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([
                            ...state.undoStack,
                            {
                                type: "update",
                                id,
                                before: { text: before.text, normalized: before.normalized },
                                after: { text: after.text, normalized: after.normalized },
                            },
                        ]),
                        redoStack: [],
                    };
                }),

            toggleTodo: id =>
                set(state => {
                    let before: Todo | null = null;
                    let after: Todo | null = null;

                    const next = state.todos.map(t => {
                        if (t.id !== id) return t;
                        before = t;
                        after = touchTodo(t, {
                            completed: !t.completed,
                            completedAt: !t.completed ? now() : null,
                        });
                        return after;
                    });

                    if (!before || !after) return state;

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([
                            ...state.undoStack,
                            {
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
                            },
                        ]),
                        redoStack: [],
                    };
                }),

            toggleMany: (ids, completed) =>
                set(state => {
                    const setIds = new Set(ids);

                    const beforeMap = new Map<string, Todo>();
                    const afterMap = new Map<string, Todo>();

                    const next = state.todos.map(t => {
                        if (!setIds.has(t.id)) return t;

                        beforeMap.set(t.id, t);

                        const updated = touchTodo(t, {
                            completed,
                            completedAt: completed ? now() : null,
                        });

                        afterMap.set(t.id, updated);
                        return updated;
                    });

                    const updates = buildBulkUpdate(ids, beforeMap, afterMap);

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([...state.undoStack, { type: "bulkUpdate", updates }]),
                        redoStack: [],
                    };
                }),

            togglePinned: id =>
                set(state => {
                    const beforeMap = new Map<string, Todo>();
                    const afterMap = new Map<string, Todo>();

                    const next = state.todos.map(t => {
                        if (t.id !== id) return t;
                        beforeMap.set(t.id, t);
                        const updated = touchTodo(t, { pinned: !t.pinned });
                        afterMap.set(t.id, updated);
                        return updated;
                    });

                    const updates = buildBulkUpdate([id], beforeMap, afterMap);

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([...state.undoStack, { type: "bulkUpdate", updates }]),
                        redoStack: [],
                    };
                }),

            archiveMany: (ids, archived) =>
                set(state => {
                    const setIds = new Set(ids);

                    const beforeMap = new Map<string, Todo>();
                    const afterMap = new Map<string, Todo>();

                    const next = state.todos.map(t => {
                        if (!setIds.has(t.id)) return t;

                        beforeMap.set(t.id, t);
                        const updated = touchTodo(t, { archived });
                        afterMap.set(t.id, updated);
                        return updated;
                    });

                    const updates = buildBulkUpdate(ids, beforeMap, afterMap);

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([...state.undoStack, { type: "bulkUpdate", updates }]),
                        redoStack: [],
                    };
                }),

            setPriority: (id, priority) =>
                set(state => {
                    const beforeMap = new Map<string, Todo>();
                    const afterMap = new Map<string, Todo>();

                    const next = state.todos.map(t => {
                        if (t.id !== id) return t;

                        beforeMap.set(t.id, t);
                        const updated = touchTodo(t, { priority });
                        afterMap.set(t.id, updated);
                        return updated;
                    });

                    const updates = buildBulkUpdate([id], beforeMap, afterMap);

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([...state.undoStack, { type: "bulkUpdate", updates }]),
                        redoStack: [],
                    };
                }),

            setDueDate: (id, dueDate) =>
                set(state => {
                    const beforeMap = new Map<string, Todo>();
                    const afterMap = new Map<string, Todo>();

                    const next = state.todos.map(t => {
                        if (t.id !== id) return t;

                        beforeMap.set(t.id, t);
                        const updated = touchTodo(t, { dueDate });
                        afterMap.set(t.id, updated);
                        return updated;
                    });

                    const updates = buildBulkUpdate([id], beforeMap, afterMap);

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([...state.undoStack, { type: "bulkUpdate", updates }]),
                        redoStack: [],
                    };
                }),

            reorderTodos: (from, to) =>
                set(state => {
                    if (from === to) return state;

                    const arr = [...state.todos];
                    if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return state;

                    const before = [...arr];
                    const [moved] = arr.splice(from, 1);
                    arr.splice(to, 0, moved);
                    const next = reorderIndexes(arr);

                    const updates = buildBulkUpdate(
                        next.map(t => t.id),
                        new Map(before.map(t => [t.id, t])),
                        new Map(next.map(t => [t.id, t]))
                    );

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([...state.undoStack, { type: "bulkUpdate", updates }]),
                        redoStack: [],
                    };
                }),

            deleteTodo: id => get().deleteMany([id]),

            deleteMany: ids =>
                set(state => {
                    const setIds = new Set(ids);
                    const removed: RemovedTodo[] = [];

                    state.todos.forEach((t, i) => {
                        if (setIds.has(t.id)) removed.push({ todo: t, index: i });
                    });

                    if (!removed.length) return state;

                    const next = reorderIndexes(state.todos.filter(t => !setIds.has(t.id)));

                    return {
                        ...state,
                        todos: next,
                        undoStack: limitHistory([...state.undoStack, { type: "delete", removed }]),
                        redoStack: [],
                    };
                }),

            clearCompleted: () =>
                set(state => {
                    const ids = state.todos.filter(t => t.completed).map(t => t.id);
                    return get().deleteMany(ids);
                }),

            undo: () =>
                set(state => {
                    const action = state.undoStack.at(-1);
                    if (!action) return state;

                    let next = [...state.todos];

                    switch (action.type) {
                        case "add":
                            next = next.filter(t => t.id !== action.todo.id);
                            break;

                        case "delete": {
                            const restored = [...next];
                            action.removed
                                .sort((a, b) => a.index - b.index)
                                .forEach(r => restored.splice(r.index, 0, r.todo));
                            next = reorderIndexes(restored);
                            break;
                        }

                        case "update":
                            next = next.map(t =>
                                t.id === action.id ? { ...t, ...action.before } : t
                            );
                            break;

                        case "bulkUpdate":
                            next = next.map(t => {
                                const u = action.updates.find(x => x.id === t.id);
                                return u ? { ...t, ...u.before } : t;
                            });
                            break;
                    }

                    return {
                        ...state,
                        todos: next,
                        undoStack: state.undoStack.slice(0, -1),
                        redoStack: limitHistory([...state.redoStack, action]),
                    };
                }),

            redo: () =>
                set(state => {
                    const action = state.redoStack.at(-1);
                    if (!action) return state;

                    let next = [...state.todos];

                    switch (action.type) {
                        case "add":
                            next = reorderIndexes([action.todo, ...next]);
                            break;

                        case "delete": {
                            const ids = new Set(action.removed.map(r => r.todo.id));
                            next = reorderIndexes(next.filter(t => !ids.has(t.id)));
                            break;
                        }

                        case "update":
                            next = next.map(t =>
                                t.id === action.id ? { ...t, ...action.after } : t
                            );
                            break;

                        case "bulkUpdate":
                            next = next.map(t => {
                                const u = action.updates.find(x => x.id === t.id);
                                return u ? { ...t, ...u.after } : t;
                            });
                            break;
                    }

                    return {
                        ...state,
                        todos: next,
                        redoStack: state.redoStack.slice(0, -1),
                        undoStack: limitHistory([...state.undoStack, action]),
                    };
                }),

            setSearch: value =>
                set({
                    search: value,
                    searchNormalized: normalizeText(value),
                }),

            setActiveCategory: value => set({ activeCategory: value }),

            setHydrated: value => set({ hydrated: value }),
        }),
        {
            name: "todo-storage",
            version: 28,
            storage: createJSONStorage(() => localStorage),
            migrate: persisted => persisted as TodoStore,
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
    useTodoStore(state =>
        sortTodos(
            state.todos.filter(todo => {
                if (state.activeCategory !== "archived" && todo.archived) return false;

                if (!todo.normalized.includes(state.searchNormalized)) return false;

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
            })
        )
    );

export const useTodoStats = () =>
    useTodoStore(state => {
        let completed = 0;
        let archived = 0;
        let overdue = 0;
        let stale = 0;

        for (const t of state.todos) {
            if (t.completed) completed++;
            if (t.archived) archived++;
            if (isOverdue(t)) overdue++;
            if (isStale(t)) stale++;
        }

        return {
            total: state.todos.length,
            completed,
            active: state.todos.length - completed,
            archived,
            overdue,
            stale,
        };
    });