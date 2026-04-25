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
    | { type: "delete"; todo: Todo; index: number }
    | { type: "edit"; before: Todo; after: Todo }
    | { type: "toggle"; before: Todo; after: Todo }
    | { type: "reorder"; from: number; to: number }
    | { type: "clear"; removed: { todo: Todo; index: number }[] }
    | { type: "toggleAll"; before: Todo[]; after: Todo[] };

const STORAGE_KEY = "donezo-todos";
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
            return todos.filter((t) => t.id !== action.todo.id);

        case "edit":
        case "toggle":
            return todos.map((t) =>
                t.id === action.after.id ? action.after : t
            );

        case "reorder": {
            const arr = [...todos];
            const [moved] = arr.splice(action.from, 1);
            arr.splice(action.to, 0, moved);
            return arr;
        }

        case "clear": {
            const ids = new Set(action.removed.map(r => r.todo.id));
            return todos.filter((t) => !ids.has(t.id));
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
            return todos.filter((t) => t.id !== action.todo.id);

        case "delete": {
            const arr = [...todos];
            arr.splice(action.index, 0, action.todo);
            return arr;
        }

        case "edit":
        case "toggle":
            return todos.map((t) =>
                t.id === action.before.id ? action.before : t
            );

        case "reorder": {
            const arr = [...todos];
            const [moved] = arr.splice(action.to, 1);
            arr.splice(action.from, 0, moved);
            return arr;
        }

        case "clear": {
            const arr = [...todos];
            action.removed.forEach(({ todo, index }) => {
                arr.splice(index, 0, todo);
            });
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

    const persistTimer = useRef<NodeJS.Timeout | null>(null);

    /* ---------------- persist ---------------- */

    const persist = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
        localStorage.setItem(SEARCH_KEY, JSON.stringify(search));
    }, [todos, filter, search]);

    useEffect(() => {
        if (persistTimer.current) clearTimeout(persistTimer.current);

        persistTimer.current = setTimeout(persist, 300);

        return () => {
            if (persistTimer.current) clearTimeout(persistTimer.current);
        };
    }, [persist]);

    useEffect(() => {
        window.addEventListener("beforeunload", persist);
        return () => window.removeEventListener("beforeunload", persist);
    }, [persist]);

    /* ---------------- helpers ---------------- */

    const pushUndo = useCallback((action: Action) => {
        setUndoStack((prev) => {
            const next = [...prev, action];
            if (next.length > MAX_STACK) next.shift();
            return next;
        });
        setRedoStack([]);
    }, []);

    /* ---------------- actions ---------------- */

    const addTodo = useCallback((text: string) => {
        const value = text.trim();
        if (!value) return;

        const todo: Todo = {
            id: crypto.randomUUID(),
            text: value,
            completed: false,
        };

        pushUndo({ type: "add", todo });
        setTodos((prev) => applyAction(prev, { type: "add", todo }));
    }, [pushUndo]);

    const toggleTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const t = prev.find(x => x.id === id);
            if (!t) return prev;

            const next = { ...t, completed: !t.completed };

            pushUndo({ type: "toggle", before: t, after: next });

            return applyAction(prev, {
                type: "toggle",
                before: t,
                after: next,
            });
        });
    }, [pushUndo]);

    const toggleAll = useCallback(() => {
        setTodos((prev) => {
            const allDone = prev.every(t => t.completed);

            const next = prev.map(t => ({
                ...t,
                completed: !allDone,
            }));

            pushUndo({
                type: "toggleAll",
                before: prev,
                after: next,
            });

            return next;
        });
    }, [pushUndo]);

    const editTodo = useCallback((id: string, text: string) => {
        const value = text.trim();
        if (!value) return;

        setTodos((prev) => {
            const t = prev.find(x => x.id === id);
            if (!t || t.text === value) return prev;

            const next = { ...t, text: value };

            pushUndo({ type: "edit", before: t, after: next });

            return applyAction(prev, {
                type: "edit",
                before: t,
                after: next,
            });
        });
    }, [pushUndo]);

    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const index = prev.findIndex(t => t.id === id);
            if (index === -1) return prev;

            const todo = prev[index];

            pushUndo({ type: "delete", todo, index });

            return applyAction(prev, { type: "delete", todo, index });
        });
    }, [pushUndo]);

    const deleteMany = useCallback((ids: string[]) => {
        setTodos((prev) => {
            const removed = prev
                .map((t, i) => ({ todo: t, index: i }))
                .filter(x => ids.includes(x.todo.id));

            if (!removed.length) return prev;

            pushUndo({ type: "clear", removed });

            return applyAction(prev, { type: "clear", removed });
        });
    }, [pushUndo]);

    const reorderTodos = useCallback((from: number, to: number) => {
        if (from === to) return;

        pushUndo({ type: "reorder", from, to });

        setTodos((prev) => applyAction(prev, { type: "reorder", from, to }));
    }, [pushUndo]);

    const clearCompleted = useCallback(() => {
        setTodos((prev) => {
            const removed = prev
                .map((t, i) => ({ todo: t, index: i }))
                .filter(x => x.todo.completed);

            if (!removed.length) return prev;

            pushUndo({ type: "clear", removed });

            return applyAction(prev, { type: "clear", removed });
        });
    }, [pushUndo]);

    /* ---------------- undo / redo ---------------- */

    const undo = useCallback(() => {
        setUndoStack((prev) => {
            const action = prev.at(-1);
            if (!action) return prev;

            setRedoStack(r => [...r, action]);
            setTodos(t => revertAction(t, action));

            return prev.slice(0, -1);
        });
    }, []);

    const redo = useCallback(() => {
        setRedoStack((prev) => {
            const action = prev.at(-1);
            if (!action) return prev;

            setUndoStack(u => [...u, action]);
            setTodos(t => applyAction(t, action));

            return prev.slice(0, -1);
        });
    }, []);

    /* ---------------- derived ---------------- */

    const filteredTodos = useMemo(() => {
        const lower = search.toLowerCase();

        return todos.filter((t) => {
            if (!t.text.toLowerCase().includes(lower)) return false;

            if (filter === "completed") return t.completed;
            if (filter === "active") return !t.completed;

            return true;
        });
    }, [todos, filter, search]);

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
        filter,
        setFilter,
        search,
        setSearch,
        addTodo,
        deleteTodo,
        deleteMany,
        toggleTodo,
        toggleAll,
        editTodo,
        reorderTodos,
        clearCompleted,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        filteredTodos,
        stats,
    };
}