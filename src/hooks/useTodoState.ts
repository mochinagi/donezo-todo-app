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
    | { type: "toggle"; before: Todo }
    | { type: "reorder"; from: number; to: number }
    | { type: "clear"; removed: Todo[] };

/* ================= CONST ================= */

const STORAGE_KEY = "donezo-todos";
const MAX_STACK = 50;

/* ================= STORAGE ================= */

const loadTodos = (): Todo[] => {
    if (typeof window === "undefined") return [];

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(
            (t): t is Todo =>
                t &&
                typeof t.id === "string" &&
                typeof t.text === "string" &&
                typeof t.completed === "boolean"
        );
    } catch {
        return [];
    }
};

/* ================= HOOK ================= */

export function useTodoState(initialTodos: Todo[] = []) {
    const [todos, setTodos] = useState<Todo[]>(() => {
        const stored = loadTodos();
        return stored.length ? stored : initialTodos;
    });

    const [filter, setFilter] = useState<FilterType>("all");

    const [undoStack, setUndoStack] = useState<Action[]>([]);
    const [redoStack, setRedoStack] = useState<Action[]>([]);

    const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (persistTimer.current) clearTimeout(persistTimer.current);

        persistTimer.current = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
            } catch { }
        }, 300);

        return () => {
            if (persistTimer.current) clearTimeout(persistTimer.current);
        };
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
        setTodos((prev) => {
            const target = prev.find((t) => t.id === id);
            if (!target) return prev;

            pushUndo({ type: "toggle", before: target });

            return prev.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t
            );
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

            return prev.map((t) => (t.id === id ? updated : t));
        });
    }, [pushUndo]);

    const reorderTodos = useCallback((from: number, to: number) => {
        if (from === to) return;

        setTodos((prev) => {
            if (from < 0 || to < 0 || from >= prev.length || to >= prev.length)
                return prev;

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
        setUndoStack((prev) => {
            const action = prev.at(-1);
            if (!action) return prev;

            setRedoStack((r) => [...r, action]);

            setTodos((todosPrev) => {
                switch (action.type) {
                    case "add":
                        return todosPrev.filter((t) => t.id !== action.todo.id);

                    case "delete": {
                        const arr = [...todosPrev];
                        arr.splice(action.index, 0, action.todo);
                        return arr;
                    }

                    case "edit":
                    case "toggle":
                        return todosPrev.map((t) =>
                            t.id === action.before.id ? action.before : t
                        );

                    case "reorder": {
                        const arr = [...todosPrev];
                        const [moved] = arr.splice(action.to, 1);
                        arr.splice(action.from, 0, moved);
                        return arr;
                    }

                    case "clear":
                        return [...action.removed, ...todosPrev];

                    default:
                        return todosPrev;
                }
            });

            return prev.slice(0, -1);
        });
    }, []);

    /* ---------------- redo ---------------- */

    const redo = useCallback(() => {
        setRedoStack((prev) => {
            const action = prev.at(-1);
            if (!action) return prev;

            setUndoStack((u) => [...u, action]);

            setTodos((todosPrev) => {
                switch (action.type) {
                    case "add":
                        return [action.todo, ...todosPrev];

                    case "delete":
                        return todosPrev.filter((t) => t.id !== action.todo.id);

                    case "edit":
                        return todosPrev.map((t) =>
                            t.id === action.after.id ? action.after : t
                        );

                    case "toggle":
                        return todosPrev.map((t) =>
                            t.id === action.before.id
                                ? { ...t, completed: !t.completed }
                                : t
                        );

                    case "reorder": {
                        const arr = [...todosPrev];
                        const [moved] = arr.splice(action.from, 1);
                        arr.splice(action.to, 0, moved);
                        return arr;
                    }

                    case "clear": {
                        const removedSet = new Set(action.removed.map(r => r.id));
                        return todosPrev.filter(t => !removedSet.has(t.id));
                    }

                    default:
                        return todosPrev;
                }
            });

            return prev.slice(0, -1);
        });
    }, []);

    /* ---------------- derived ---------------- */

    const filteredTodos = useMemo(() => {
        if (filter === "completed") return todos.filter((t) => t.completed);
        if (filter === "active") return todos.filter((t) => !t.completed);
        return todos;
    }, [todos, filter]);

    const stats = useMemo(() => {
        let completed = 0;

        for (const t of todos) {
            if (t.completed) completed++;
        }

        const total = todos.length;

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