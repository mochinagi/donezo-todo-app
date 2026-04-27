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

const STORAGE_KEY = "donezo-todos-v2";
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
            const arr = [...todos];
            const [moved] = arr.splice(action.from, 1);
            arr.splice(action.to, 0, moved);
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
            const [moved] = arr.splice(action.to, 1);
            arr.splice(action.from, 0, moved);
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

    /* ---------------- persist ---------------- */

    useEffect(() => {
        if (persistTimer.current) clearTimeout(persistTimer.current);

        persistTimer.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
            localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
            localStorage.setItem(SEARCH_KEY, JSON.stringify(search));
        }, 300);

        return () => {
            if (persistTimer.current) clearTimeout(persistTimer.current);
        };
    }, [todos, filter, search]);

    /* ---------------- dispatch ---------------- */

    const dispatch = useCallback((action: Action) => {
        setTodos(prev => applyAction(prev, action));

        setUndoStack(prev => {
            const next = [...prev, action];
            if (next.length > MAX_STACK) next.shift();
            return next;
        });

        setRedoStack([]);
    }, []);

    /* ---------------- actions ---------------- */

    const addTodo = useCallback((text: string) => {
        const todo: Todo = {
            id: crypto.randomUUID(),
            text,
            completed: false,
        };

        dispatch({ type: "add", todo });
    }, [dispatch]);

    const toggleTodo = useCallback((id: string) => {
        setTodos(prev => {
            const target = prev.find(t => t.id === id);
            if (!target) return prev;

            const next = { ...target, completed: !target.completed };

            dispatch({
                type: "toggle",
                before: target,
                after: next,
            });

            return prev;
        });
    }, [dispatch]);

    const editTodo = useCallback((id: string, text: string) => {
        setTodos(prev => {
            const target = prev.find(t => t.id === id);
            if (!target) return prev;

            const next = { ...target, text };

            dispatch({
                type: "edit",
                before: target,
                after: next,
            });

            return prev;
        });
    }, [dispatch]);

    const deleteMany = useCallback((ids: string[]) => {
        setTodos(prev => {
            const removed: { todo: Todo; index: number }[] = [];

            const next = prev.filter((t, i) => {
                if (ids.includes(t.id)) {
                    removed.push({ todo: t, index: i });
                    return false;
                }
                return true;
            });

            if (removed.length) {
                dispatch({ type: "delete", removed });
            }

            return next;
        });
    }, [dispatch]);

    const clearCompleted = useCallback(() => {
        setTodos(prev => {
            const removed: { todo: Todo; index: number }[] = [];

            const next = prev.filter((t, i) => {
                if (t.completed) {
                    removed.push({ todo: t, index: i });
                    return false;
                }
                return true;
            });

            if (removed.length) {
                dispatch({ type: "clearCompleted", removed });
            }

            return next;
        });
    }, [dispatch]);

    const reorder = useCallback((from: number, to: number) => {
        dispatch({ type: "reorder", from, to });
    }, [dispatch]);

    const toggleAll = useCallback(() => {
        setTodos(prev => {
            const allDone = prev.every(t => t.completed);
            const next = prev.map(t => ({
                ...t,
                completed: !allDone,
            }));

            dispatch({
                type: "toggleAll",
                before: prev,
                after: next,
            });

            return prev;
        });
    }, [dispatch]);

    /* ---------------- undo / redo ---------------- */

    const undo = useCallback(() => {
        setUndoStack(prev => {
            const action = prev.at(-1);
            if (!action) return prev;

            setTodos(t => revertAction(t, action));

            setRedoStack(r => [...r, action]);

            return prev.slice(0, -1);
        });
    }, []);

    const redo = useCallback(() => {
        setRedoStack(prev => {
            const action = prev.at(-1);
            if (!action) return prev;

            setTodos(t => applyAction(t, action));

            setUndoStack(u => [...u, action]);

            return prev.slice(0, -1);
        });
    }, []);

    /* ---------------- derived ---------------- */

    const filteredTodos = useMemo(() => {
        return todos.filter(t => {
            if (!t.text.toLowerCase().includes(normalizedSearch)) return false;

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
            completionRate:
                total === 0 ? 0 : Math.round((completed / total) * 100),
        };
    }, [todos]);

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

        stats,
    };
}