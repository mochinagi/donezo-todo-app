"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

/* ================= TYPES ================= */

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

export type FilterType = "all" | "completed" | "active";

type UndoItem = {
    todo: Todo;
    index: number;
};

type UndoAction =
    | { type: "delete"; payload: UndoItem }
    | { type: "add"; payload: { id: string } }
    | { type: "edit"; payload: { prev: Todo } }
    | { type: "toggle"; payload: { prev: Todo } }
    | { type: "reorder"; payload: { from: number; to: number } }
    | { type: "clear"; payload: { removed: Todo[] } };

/* ================= CONST ================= */

const STORAGE_KEY = "donezo-todos";
const MAX_UNDO = 50;

const filterMap: Record<FilterType, (t: Todo) => boolean> = {
    all: () => true,
    completed: (t) => t.completed,
    active: (t) => !t.completed,
};

/* ================= UTILS ================= */

function safeParseTodos(value: string | null): Todo[] {
    try {
        const parsed = JSON.parse(value || "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (t) =>
                typeof t.id === "string" &&
                typeof t.text === "string" &&
                typeof t.completed === "boolean"
        );
    } catch {
        return [];
    }
}

function saveTodos(todos: Todo[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch { }
}

function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ================= HOOK ================= */

export function useTodoState(initialTodos: Todo[] = []) {
    const [todos, setTodos] = useState<Todo[]>(() => {
        if (typeof window === "undefined") return initialTodos;
        const stored = safeParseTodos(localStorage.getItem(STORAGE_KEY));
        return stored.length ? stored : initialTodos;
    });

    const [filter, setFilter] = useState<FilterType>("all");
    const [undoCount, setUndoCount] = useState(0);

    const undoStack = useRef<UndoAction[]>([]);
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ---------------- undo helper ---------------- */
    const record = useCallback((action: UndoAction) => {
        undoStack.current.push(action);
        if (undoStack.current.length > MAX_UNDO) {
            undoStack.current.shift();
        }
        setUndoCount(undoStack.current.length);
    }, []);

    /* ---------------- persist ---------------- */
    useEffect(() => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(() => {
            saveTodos(todos);
        }, 300);

        return () => {
            if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }
        };
    }, [todos]);

    /* ---------------- actions ---------------- */

    const addTodo = useCallback((text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const id = generateId();

        record({ type: "add", payload: { id } });

        setTodos((prev) => {
            if (prev.some((t) => t.text.toLowerCase() === trimmed.toLowerCase()))
                return prev;

            return [{ id, text: trimmed, completed: false }, ...prev];
        });
    }, [record]);

    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const index = prev.findIndex((t) => t.id === id);
            if (index === -1) return prev;

            record({
                type: "delete",
                payload: { todo: prev[index], index },
            });

            return prev.filter((t) => t.id !== id);
        });
    }, [record]);

    const toggleTodo = useCallback((id: string) => {
        setTodos((prev) =>
            prev.map((t) => {
                if (t.id !== id) return t;

                record({ type: "toggle", payload: { prev: t } });

                return { ...t, completed: !t.completed };
            })
        );
    }, [record]);

    const editTodo = useCallback((id: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setTodos((prev) =>
            prev.map((t) => {
                if (t.id !== id || t.text === trimmed) return t;

                record({ type: "edit", payload: { prev: t } });

                return { ...t, text: trimmed };
            })
        );
    }, [record]);

    const reorderTodos = useCallback((from: number, to: number) => {
        setTodos((prev) => {
            if (
                from === to ||
                from < 0 ||
                to < 0 ||
                from >= prev.length ||
                to >= prev.length
            ) return prev;

            record({ type: "reorder", payload: { from, to } });

            const updated = [...prev];
            const [moved] = updated.splice(from, 1);
            updated.splice(to, 0, moved);

            return updated;
        });
    }, [record]);

    const clearCompleted = useCallback(() => {
        setTodos((prev) => {
            const removed = prev.filter((t) => t.completed);
            if (!removed.length) return prev;

            record({ type: "clear", payload: { removed } });

            return prev.filter((t) => !t.completed);
        });
    }, [record]);

    /* ---------------- undo ---------------- */
    // 注意：undo 本身不会记录 undo（否则会形成循环）
    const undo = useCallback(() => {
        const action = undoStack.current.pop();
        if (!action) return;

        setUndoCount(undoStack.current.length);

        setTodos((prev) => {
            switch (action.type) {
                case "delete": {
                    const updated = [...prev];
                    updated.splice(action.payload.index, 0, action.payload.todo);
                    return updated;
                }
                case "add":
                    return prev.filter((t) => t.id !== action.payload.id);

                case "edit":
                case "toggle":
                    return prev.map((t) =>
                        t.id === action.payload.prev.id ? action.payload.prev : t
                    );

                case "reorder": {
                    const updated = [...prev];
                    const [moved] = updated.splice(action.payload.to, 1);
                    updated.splice(action.payload.from, 0, moved);
                    return updated;
                }

                case "clear":
                    return [...action.payload.removed, ...prev];

                default:
                    return prev;
            }
        });
    }, []);

    /* ---------------- derived ---------------- */

    const filteredTodos = useMemo(
        () => todos.filter(filterMap[filter]),
        [todos, filter]
    );

    const stats = useMemo(() => {
        const base = todos.reduce(
            (acc, t) => ({
                total: acc.total + 1,
                completed: acc.completed + (t.completed ? 1 : 0),
            }),
            { total: 0, completed: 0 }
        );

        const active = base.total - base.completed;

        return {
            ...base,
            active,
            completionRate: base.total
                ? Math.round((base.completed / base.total) * 100)
                : 0,
            hasCompleted: base.completed > 0,
            hasActive: active > 0,
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
        canUndo: undoCount > 0,
        filteredTodos,
        stats,
    };
}