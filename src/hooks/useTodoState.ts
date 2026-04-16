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
    | { type: "reorder"; payload: { from: number; to: number } };

const STORAGE_KEY = "donezo-todos";
const MAX_UNDO = 50;

/* ================= FILTER ================= */

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

function pushUndo(stack: React.MutableRefObject<UndoAction[]>, action: UndoAction) {
    stack.current.push(action);
    if (stack.current.length > MAX_UNDO) {
        stack.current.shift();
    }
}

/* ================= HOOK ================= */

export function useTodoState(initialTodos: Todo[] = []) {
    const [todos, setTodos] = useState<Todo[]>(() => {
        if (typeof window === "undefined") return initialTodos;

        const stored = safeParseTodos(localStorage.getItem(STORAGE_KEY));
        return stored.length ? stored : initialTodos;
    });

    const [filter, setFilter] = useState<FilterType>("all");

    const undoStack = useRef<UndoAction[]>([]);

    /* ---------------- SAVE ---------------- */

    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        }, 300);

        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, [todos]);

    /* ---------------- ADD ---------------- */

    const addTodo = useCallback((text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const id = crypto.randomUUID();

        setTodos((prev) => {
            if (prev.some((t) => t.text === trimmed)) return prev;

            pushUndo(undoStack, { type: "add", payload: { id } });

            return [...prev, { id, text: trimmed, completed: false }];
        });
    }, []);

    /* ---------------- DELETE ---------------- */

    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const index = prev.findIndex((t) => t.id === id);
            if (index === -1) return prev;

            pushUndo(undoStack, {
                type: "delete",
                payload: { todo: prev[index], index },
            });

            return prev.filter((t) => t.id !== id);
        });
    }, []);

    /* ---------------- TOGGLE ---------------- */

    const toggleTodo = useCallback((id: string) => {
        setTodos((prev) =>
            prev.map((t) => {
                if (t.id !== id) return t;

                pushUndo(undoStack, {
                    type: "toggle",
                    payload: { prev: t },
                });

                return { ...t, completed: !t.completed };
            })
        );
    }, []);

    /* ---------------- EDIT ---------------- */

    const editTodo = useCallback((id: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setTodos((prev) =>
            prev.map((t) => {
                if (t.id !== id) return t;
                if (t.text === trimmed) return t;

                pushUndo(undoStack, {
                    type: "edit",
                    payload: { prev: t },
                });

                return { ...t, text: trimmed };
            })
        );
    }, []);

    /* ---------------- REORDER ---------------- */

    const reorderTodos = useCallback((from: number, to: number) => {
        setTodos((prev) => {
            if (from === to || from < 0 || to < 0) return prev;

            pushUndo(undoStack, {
                type: "reorder",
                payload: { from, to },
            });

            const updated = [...prev];
            const [moved] = updated.splice(from, 1);
            updated.splice(to, 0, moved);

            return updated;
        });
    }, []);

    /* ---------------- CLEAR COMPLETED ---------------- */

    const clearCompleted = useCallback(() => {
        setTodos((prev) => prev.filter((t) => !t.completed));
    }, []);

    /* ---------------- UNDO ---------------- */

    const undo = useCallback(() => {
        const action = undoStack.current.pop();
        if (!action) return;

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
                    return prev.map((t) =>
                        t.id === action.payload.prev.id ? action.payload.prev : t
                    );

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

                default:
                    return prev;
            }
        });
    }, []);

    /* ---------------- FILTER ---------------- */

    const filteredTodos = useMemo(
        () => todos.filter(filterMap[filter]),
        [todos, filter]
    );

    /* ---------------- STATS ---------------- */

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
            hasCompleted: completed > 0,
            hasActive: total - completed > 0,
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
        filteredTodos,
        stats,
    };
}