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
    | { type: "clear"; removed: Todo[] };

/* ================= CONST ================= */

const STORAGE_KEY = "donezo-todos";
const FILTER_KEY = "donezo-filter";
const MAX_STACK = 50;

/* ================= STORAGE ================= */

const loadTodos = (): Todo[] => {
    if (typeof window === "undefined") return [];

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
};

const loadFilter = (): FilterType => {
    if (typeof window === "undefined") return "all";
    return (localStorage.getItem(FILTER_KEY) as FilterType) || "all";
};

/* ================= CORE ================= */

const applyAction = (todos: Todo[], action: Action): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete":
            return todos.filter((t) => t.id !== action.todo.id);

        case "edit":
            return todos.map((t) =>
                t.id === action.after.id ? action.after : t
            );

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
            const removedSet = new Set(action.removed.map((r) => r.id));
            return todos.filter((t) => !removedSet.has(t.id));
        }

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

        case "clear":
            return [...action.removed, ...todos];

        default:
            return todos;
    }
};

/* ================= HOOK ================= */

export function useTodoState(initialTodos: Todo[] = []) {
    const [todos, setTodos] = useState<Todo[]>(() => {
        const stored = loadTodos();
        return stored.length ? stored : initialTodos;
    });

    const [filter, setFilter] = useState<FilterType>(() => loadFilter());

    const [undoStack, setUndoStack] = useState<Action[]>([]);
    const [redoStack, setRedoStack] = useState<Action[]>([]);

    const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ---------------- persist ---------------- */

    useEffect(() => {
        if (persistTimer.current) clearTimeout(persistTimer.current);

        persistTimer.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
            localStorage.setItem(FILTER_KEY, filter);
        }, 300);

        return () => {
            if (persistTimer.current) clearTimeout(persistTimer.current);
        };
    }, [todos, filter]);

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
        const trimmed = text.trim();
        if (!trimmed) return;

        const todo: Todo = {
            id: crypto.randomUUID(),
            text: trimmed,
            completed: false,
        };

        pushUndo({ type: "add", todo });
        setTodos((prev) => applyAction(prev, { type: "add", todo }));
    }, [pushUndo]);

    const toggleTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const target = prev.find((t) => t.id === id);
            if (!target) return prev;

            const updated = { ...target, completed: !target.completed };

            pushUndo({ type: "toggle", before: target, after: updated });

            return applyAction(prev, {
                type: "toggle",
                before: target,
                after: updated,
            });
        });
    }, [pushUndo]);

    const editTodo = useCallback((id: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setTodos((prev) => {
            const target = prev.find((t) => t.id === id);
            if (!target || target.text === trimmed) return prev;

            const updated = { ...target, text: trimmed };

            pushUndo({ type: "edit", before: target, after: updated });

            return applyAction(prev, {
                type: "edit",
                before: target,
                after: updated,
            });
        });
    }, [pushUndo]);

    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const index = prev.findIndex((t) => t.id === id);
            if (index === -1) return prev;

            const todo = prev[index];

            pushUndo({ type: "delete", todo, index });

            return applyAction(prev, { type: "delete", todo, index });
        });
    }, [pushUndo]);

    const reorderTodos = useCallback((from: number, to: number) => {
        if (from === to) return;

        pushUndo({ type: "reorder", from, to });

        setTodos((prev) => applyAction(prev, { type: "reorder", from, to }));
    }, [pushUndo]);

    const clearCompleted = useCallback(() => {
        setTodos((prev) => {
            const removed = prev.filter((t) => t.completed);
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

            setRedoStack((r) => [...r, action]);
            setTodos((t) => revertAction(t, action));

            return prev.slice(0, -1);
        });
    }, []);

    const redo = useCallback(() => {
        setRedoStack((prev) => {
            const action = prev.at(-1);
            if (!action) return prev;

            setUndoStack((u) => [...u, action]);
            setTodos((t) => applyAction(t, action));

            return prev.slice(0, -1);
        });
    }, []);

    /* ---------------- derived ---------------- */

    const filteredTodos = useMemo(() => {
        switch (filter) {
            case "completed":
                return todos.filter((t) => t.completed);
            case "active":
                return todos.filter((t) => !t.completed);
            default:
                return todos;
        }
    }, [todos, filter]);

    const stats = useMemo(() => {
        const total = todos.length;
        const completed = todos.filter((t) => t.completed).length;

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
        addTodo,
        deleteTodo,
        toggleTodo,
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