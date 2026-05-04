"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    normalized: string;
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

const STORAGE_KEY = "donezo-todos-v6";
const FILTER_KEY = "donezo-filter";
const SEARCH_KEY = "donezo-search";
const MAX_STACK = 50;

const normalizeText = (v: string) =>
    v.trim().replace(/\s+/g, " ").toLowerCase();

const safeClone = <T,>(data: T): T =>
    typeof structuredClone === "function"
        ? structuredClone(data)
        : JSON.parse(JSON.stringify(data));

const load = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

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
            [...action.removed]
                .sort((a, b) => a.index - b.index)
                .forEach(({ todo, index }) => {
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

    const undoRef = useRef<Action[]>([]);
    const redoRef = useRef<Action[]>([]);
    const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const normalizedSearch = useMemo(
        () => normalizeText(search),
        [search]
    );

    useEffect(() => {
        if (persistTimer.current) clearTimeout(persistTimer.current);

        persistTimer.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
            localStorage.setItem(FILTER_KEY, filter);
            localStorage.setItem(SEARCH_KEY, search);
        }, 200);

        return () => {
            if (persistTimer.current) clearTimeout(persistTimer.current);
        };
    }, [todos, filter, search]);

    const dispatch = useCallback((action: Action) => {
        setTodos(prev => {
            const next = applyAction(prev, action);

            undoRef.current.push(safeClone(action));
            if (undoRef.current.length > MAX_STACK) {
                undoRef.current.shift();
            }

            redoRef.current = [];
            return next;
        });
    }, []);

    const addTodo = useCallback((text: string) => {
        const value = text.trim();
        if (!value) return;

        const normalized = normalizeText(value);

        const todo: Todo = {
            id: crypto.randomUUID(),
            text: value,
            completed: false,
            createdAt: Date.now(),
            normalized,
        };

        dispatch({ type: "add", todo });
    }, [dispatch]);

    const toggleTodo = useCallback((id: string) => {
        setTodos(prev => {
            const target = prev.find(t => t.id === id);
            if (!target) return prev;

            dispatch({
                type: "toggle",
                before: safeClone(target),
                after: { ...target, completed: !target.completed },
            });

            return prev;
        });
    }, [dispatch]);

    const deleteTodo = useCallback((id: string) => {
        setTodos(prev => {
            const index = prev.findIndex(t => t.id === id);
            if (index === -1) return prev;

            dispatch({
                type: "delete",
                removed: [{ todo: prev[index], index }],
            });

            return prev;
        });
    }, [dispatch]);

    const clearCompleted = useCallback(() => {
        setTodos(prev => {
            const removed = prev
                .map((t, i) => ({ todo: t, index: i }))
                .filter(r => r.todo.completed);

            if (!removed.length) return prev;

            dispatch({ type: "clearCompleted", removed });
            return prev;
        });
    }, [dispatch]);

    const toggleAll = useCallback(() => {
        setTodos(prev => {
            const allDone = prev.every(t => t.completed);

            const after = prev.map(t => ({
                ...t,
                completed: !allDone,
            }));

            dispatch({
                type: "toggleAll",
                before: safeClone(prev),
                after,
            });

            return prev;
        });
    }, [dispatch]);

    const undo = useCallback(() => {
        const action = undoRef.current.pop();
        if (!action) return;

        setTodos(prev => revertAction(prev, action));
        redoRef.current.push(safeClone(action));
    }, []);

    const redo = useCallback(() => {
        const action = redoRef.current.pop();
        if (!action) return;

        setTodos(prev => applyAction(prev, action));
        undoRef.current.push(safeClone(action));
    }, []);

    const filteredTodos = useMemo(() => {
        return todos.filter(t => {
            if (!t.normalized.includes(normalizedSearch)) return false;
            if (filter === "completed") return t.completed;
            if (filter === "active") return !t.completed;
            return true;
        });
    }, [todos, filter, normalizedSearch]);

    const stats = useMemo(() => {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        return {
            total,
            completed,
            active: total - completed,
        };
    }, [todos]);

    return {
        todos,
        filteredTodos,
        stats,

        filter,
        setFilter,
        search,
        setSearch,

        addTodo,
        toggleTodo,
        deleteTodo,
        clearCompleted,
        toggleAll,

        undo,
        redo,
        canUndo: undoRef.current.length > 0,
        canRedo: redoRef.current.length > 0,
    };
}