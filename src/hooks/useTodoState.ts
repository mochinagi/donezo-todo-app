"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

/* ================= TYPES ================= */

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

export type FilterType = "all" | "completed" | "active";

type Action =
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: { todo: Todo; index: number }[] }
    | { type: "edit"; before: Todo; after: Todo }
    | { type: "toggle"; before: Todo; after: Todo }
    | { type: "reorder"; from: number; to: number }
    | { type: "clearCompleted"; removed: { todo: Todo; index: number }[] }
    | { type: "toggleAll"; before: Todo[]; after: Todo[] };

const STORAGE_KEY = "donezo-todos-v3";
const FILTER_KEY = "donezo-filter";
const SEARCH_KEY = "donezo-search";
const MAX_STACK = 50;

/* ================= STORAGE ================= */

const load = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

/* ================= CORE ================= */

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

const applyAction = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete":
        case "clearCompleted": {
            const ids = new Set(action.removed.map(r => r.todo.id));
            return todos.filter(t => !ids.has(t.id));
        }

        case "edit":
        case "toggle":
            return todos.map(t =>
                t.id === action.after.id ? action.after : t
            );

        case "reorder": {
            if (action.from === action.to) return todos;

            const arr = [...todos];
            const from = clamp(action.from, 0, arr.length - 1);
            const to = clamp(action.to, 0, arr.length - 1);

            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);

            return arr;
        }

        case "toggleAll":
            return action.after;

        default:
            return todos;
    }
};

const revertAction = (todos: Todo[], action: Action): Todo[] => {
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

        case "edit":
        case "toggle":
            return todos.map(t =>
                t.id === action.before.id ? action.before : t
            );

        case "reorder": {
            const arr = [...todos];
            const from = clamp(action.to, 0, arr.length - 1);
            const to = clamp(action.from, 0, arr.length - 1);

            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);

            return arr;
        }

        case "toggleAll":
            return action.before;

        default:
            return todos;
    }
};

/* ================= HOOK ================= */

export function useTodoState(initialTodos: Todo[] = []) {
    const [todos, setTodos] = useState<Todo[]>(() =>
        load(STORAGE_KEY, initialTodos)
    );

    const [filter, setFilter] = useState<FilterType>(() =>
        load(FILTER_KEY, "all")
    );

    const [search, setSearch] = useState<string>(() =>
        load(SEARCH_KEY, "")
    );

    const [undoStack, setUndoStack] = useState<Action[]>([]);
    const [redoStack, setRedoStack] = useState<Action[]>([]);

    const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const normalizedSearch = useMemo(
        () => search.trim().toLowerCase(),
        [search]
    );

    /* ================= PERSIST ================= */

    useEffect(() => {
        if (persistTimer.current) clearTimeout(persistTimer.current);

        persistTimer.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
            localStorage.setItem(FILTER_KEY, filter);
            localStorage.setItem(SEARCH_KEY, search);
        }, 300);

        return () => {
            if (persistTimer.current) clearTimeout(persistTimer.current);
        };
    }, [todos, filter, search]);

    /* ================= DISPATCH ================= */

    const dispatch = useCallback((action: Action) => {
        setTodos(prev => applyAction(prev, action));

        setUndoStack(prev => [...prev, action].slice(-MAX_STACK));
        setRedoStack([]);
    }, []);

    /* ================= ACTIONS ================= */

    const addTodo = useCallback((text: string) => {
        const value = text.trim();
        if (!value) return;

        if (todos.some(t => t.text === value)) return;

        dispatch({
            type: "add",
            todo: {
                id: crypto.randomUUID(),
                text: value,
                completed: false,
            },
        });
    }, [dispatch, todos]);

    const toggleTodo = useCallback((id: string) => {
        const target = todos.find(t => t.id === id);
        if (!target) return;

        const next = { ...target, completed: !target.completed };

        dispatch({ type: "toggle", before: target, after: next });
    }, [dispatch, todos]);

    const editTodo = useCallback((id: string, text: string) => {
        const value = text.trim();
        if (!value) return;

        const target = todos.find(t => t.id === id);
        if (!target) return;

        const next = { ...target, text: value };

        dispatch({ type: "edit", before: target, after: next });
    }, [dispatch, todos]);

    const deleteMany = useCallback((ids: string[]) => {
        const idSet = new Set(ids);
        const removed: { todo: Todo; index: number }[] = [];

        todos.forEach((t, i) => {
            if (idSet.has(t.id)) {
                removed.push({ todo: t, index: i });
            }
        });

        if (!removed.length) return;

        dispatch({ type: "delete", removed });
    }, [dispatch, todos]);

    const clearCompleted = useCallback(() => {
        const removed = todos
            .map((t, i) => (t.completed ? { todo: t, index: i } : null))
            .filter(Boolean) as { todo: Todo; index: number }[];

        if (!removed.length) return;

        dispatch({ type: "clearCompleted", removed });
    }, [dispatch, todos]);

    const reorder = useCallback((from: number, to: number) => {
        if (from === to) return;
        dispatch({ type: "reorder", from, to });
    }, [dispatch]);

    const toggleAll = useCallback(() => {
        const allDone = todos.every(t => t.completed);

        const next = todos.map(t => ({
            ...t,
            completed: !allDone,
        }));

        dispatch({
            type: "toggleAll",
            before: todos,
            after: next,
        });
    }, [dispatch, todos]);

    /* ================= UNDO / REDO ================= */

    const undo = useCallback(() => {
        const action = undoStack.at(-1);
        if (!action) return;

        setTodos(prev => revertAction(prev, action));
        setUndoStack(s => s.slice(0, -1));
        setRedoStack(s => [...s, action].slice(-MAX_STACK));
    }, [undoStack]);

    const redo = useCallback(() => {
        const action = redoStack.at(-1);
        if (!action) return;

        setTodos(prev => applyAction(prev, action));
        setRedoStack(s => s.slice(0, -1));
        setUndoStack(s => [...s, action].slice(-MAX_STACK));
    }, [redoStack]);

    /* ================= DERIVED ================= */

    const filteredTodos = useMemo(() => {
        return todos.filter(t => {
            if (!t.text.toLowerCase().includes(normalizedSearch)) return false;

            if (filter === "completed") return t.completed;
            if (filter === "active") return !t.completed;

            return true;
        });
    }, [todos, filter, normalizedSearch]);

    return {
        todos,
        filteredTodos,
        filter,
        setFilter,
        search,
        setSearch,

        addTodo,
        toggleTodo,
        editTodo,
        deleteMany,
        clearCompleted,
        reorder,
        toggleAll,

        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
    };
}