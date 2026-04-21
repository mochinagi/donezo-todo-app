"use client";

import { useState, useCallback, useMemo, useEffect } from "react";

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
    | { type: "edit"; prev: Todo }
    | { type: "toggle"; prev: Todo }
    | { type: "reorder"; from: number; to: number }
    | { type: "clear"; removed: Todo[] };

/* ================= CONST ================= */

const STORAGE_KEY = "donezo-todos";
const MAX_STACK = 50;

const filterMap: Record<FilterType, (t: Todo) => boolean> = {
    all: () => true,
    completed: (t) => t.completed,
    active: (t) => !t.completed,
};

/* ================= STORAGE ================= */

const loadTodos = (): Todo[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const persistTodos = (todos: Todo[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch { }
};

/* ================= HOOK ================= */

export function useTodoState(initialTodos: Todo[] = []) {
    const [todos, setTodos] = useState<Todo[]>(() => {
        if (typeof window === "undefined") return initialTodos;
        const stored = loadTodos();
        return stored.length ? stored : initialTodos;
    });

    const [filter, setFilter] = useState<FilterType>("all");

    const [undoStack, setUndoStack] = useState<Action[]>([]);
    const [redoStack, setRedoStack] = useState<Action[]>([]);

    /* ---------------- helpers ---------------- */

    const pushUndo = useCallback((action: Action) => {
        setUndoStack((prev) => {
            const next = [...prev, action];
            if (next.length > MAX_STACK) next.shift();
            return next;
        });
        setRedoStack([]);
    }, []);

    /* ---------------- persist ---------------- */

    useEffect(() => {
        persistTodos(todos);
    }, [todos]);

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

        setTodos((prev) => [todo, ...prev]);
    }, [pushUndo]);

    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const index = prev.findIndex((t) => t.id === id);
            if (index === -1) return prev;

            const todo = prev[index];
            pushUndo({ type: "delete", todo, index });

            return prev.filter((t) => t.id !== id);
        });
    }, [pushUndo]);

    const toggleTodo = useCallback((id: string) => {
        setTodos((prev) =>
            prev.map((t) => {
                if (t.id !== id) return t;
                pushUndo({ type: "toggle", prev: t });
                return { ...t, completed: !t.completed };
            })
        );
    }, [pushUndo]);

    const editTodo = useCallback((id: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setTodos((prev) =>
            prev.map((t) => {
                if (t.id !== id || t.text === trimmed) return t;
                pushUndo({ type: "edit", prev: t });
                return { ...t, text: trimmed };
            })
        );
    }, [pushUndo]);

    const reorderTodos = useCallback((from: number, to: number) => {
        setTodos((prev) => {
            if (from === to) return prev;

            const arr = [...prev];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);

            pushUndo({ type: "reorder", from, to });

            return arr;
        });
    }, [pushUndo]);

    const clearCompleted = useCallback(() => {
        setTodos((prev) => {
            const removed = prev.filter((t) => t.completed);
            if (!removed.length) return prev;

            pushUndo({ type: "clear", removed });

            return prev.filter((t) => !t.completed);
        });
    }, [pushUndo]);

    /* ---------------- undo ---------------- */

    const undo = useCallback(() => {
        const action = undoStack.at(-1);
        if (!action) return;

        setUndoStack((prev) => prev.slice(0, -1));
        setRedoStack((prev) => [...prev, action]);

        setTodos((prev) => {
            switch (action.type) {
                case "add":
                    return prev.filter((t) => t.id !== action.todo.id);

                case "delete": {
                    const arr = [...prev];
                    arr.splice(action.index, 0, action.todo);
                    return arr;
                }

                case "edit":
                case "toggle":
                    return prev.map((t) =>
                        t.id === action.prev.id ? action.prev : t
                    );

                case "reorder": {
                    const arr = [...prev];
                    const [moved] = arr.splice(action.to, 1);
                    arr.splice(action.from, 0, moved);
                    return arr;
                }

                case "clear":
                    return [...action.removed, ...prev];

                default:
                    return prev;
            }
        });
    }, [undoStack]);

    /* ---------------- redo ---------------- */

    const redo = useCallback(() => {
        const action = redoStack.at(-1);
        if (!action) return;

        setRedoStack((prev) => prev.slice(0, -1));
        setUndoStack((prev) => [...prev, action]);

        setTodos((prev) => {
            switch (action.type) {
                case "add":
                    return [action.todo, ...prev];

                case "delete":
                    return prev.filter((t) => t.id !== action.todo.id);

                case "toggle":
                    return prev.map((t) =>
                        t.id === action.prev.id
                            ? { ...t, completed: !t.completed }
                            : t
                    );

                case "edit":
                    return prev;

                case "reorder": {
                    const arr = [...prev];
                    const [moved] = arr.splice(action.from, 1);
                    arr.splice(action.to, 0, moved);
                    return arr;
                }

                case "clear":
                    return prev.filter(
                        (t) => !action.removed.find((r) => r.id === t.id)
                    );

                default:
                    return prev;
            }
        });
    }, [redoStack]);

    /* ---------------- derived ---------------- */

    const filteredTodos = useMemo(
        () => todos.filter(filterMap[filter]),
        [todos, filter]
    );

    const stats = useMemo(() => {
        const total = todos.length;
        const completed = todos.filter((t) => t.completed).length;
        const active = total - completed;

        return {
            total,
            completed,
            active,
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