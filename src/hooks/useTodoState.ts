"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

/* -----------------------------
   型定義
----------------------------- */
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

const STORAGE_KEY = "donezo-todos";

/* -----------------------------
   Hook
----------------------------- */
export function useTodoState(initialTodos: Todo[] = []) {
    /* -----------------------------
       初期化（安全な localStorage）
    ----------------------------- */
    const [todos, setTodos] = useState<Todo[]>(() => {
        if (typeof window === "undefined") return initialTodos;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : initialTodos;
        } catch {
            return initialTodos;
        }
    });

    const [filter, setFilter] = useState<FilterType>("all");

    /* -----------------------------
       Undo Stack（位置付き）
    ----------------------------- */
    const undoStack = useRef<UndoItem[]>([]);

    /* -----------------------------
       保存（debounce + cleanup）
    ----------------------------- */
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

    /* -----------------------------
       追加（防重复）
    ----------------------------- */
    const addTodo = useCallback((text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setTodos((prev) => {
            const exists = prev.some((t) => t.text === trimmed);
            if (exists) return prev;

            return [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    text: trimmed,
                    completed: false,
                },
            ];
        });
    }, []);

    /* -----------------------------
       削除（记录 index）
    ----------------------------- */
    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const index = prev.findIndex((t) => t.id === id);
            if (index === -1) return prev;

            undoStack.current.push({
                todo: prev[index],
                index,
            });

            return prev.filter((t) => t.id !== id);
        });
    }, []);

    /* -----------------------------
       Undo（恢复位置）
    ----------------------------- */
    const undoDelete = useCallback(() => {
        const last = undoStack.current.pop();
        if (!last) return;

        setTodos((prev) => {
            const updated = [...prev];
            updated.splice(last.index, 0, last.todo);
            return updated;
        });
    }, []);

    /* -----------------------------
       Toggle
    ----------------------------- */
    const toggleTodo = useCallback((id: string) => {
        setTodos((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t
            )
        );
    }, []);

    /* -----------------------------
       全部切替
    ----------------------------- */
    const toggleAll = useCallback(() => {
        setTodos((prev) => {
            const allCompleted = prev.every((t) => t.completed);
            return prev.map((t) => ({ ...t, completed: !allCompleted }));
        });
    }, []);

    /* -----------------------------
       編集
    ----------------------------- */
    const editTodo = useCallback((id: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setTodos((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, text: trimmed } : t
            )
        );
    }, []);

    /* -----------------------------
       並び替え（安全版）
    ----------------------------- */
    const reorderTodos = useCallback((from: number, to: number) => {
        setTodos((prev) => {
            if (
                from === to ||
                from < 0 ||
                to < 0 ||
                from >= prev.length ||
                to >= prev.length
            ) {
                return prev;
            }

            const updated = [...prev];
            const [moved] = updated.splice(from, 1);
            updated.splice(to, 0, moved);
            return updated;
        });
    }, []);

    /* -----------------------------
       全削除
    ----------------------------- */
    const clearTodos = useCallback(() => {
        setTodos([]);
        undoStack.current = [];
    }, []);

    /* -----------------------------
       フィルタ（拡張しやすい）
    ----------------------------- */
    const filterMap: Record<FilterType, (t: Todo) => boolean> = {
        all: () => true,
        completed: (t) => t.completed,
        active: (t) => !t.completed,
    };

    const filteredTodos = useMemo(() => {
        return todos.filter(filterMap[filter]);
    }, [todos, filter]);

    /* -----------------------------
       統計（reduce版）
    ----------------------------- */
    const stats = useMemo(() => {
        const { total, completed } = todos.reduce(
            (acc, t) => {
                acc.total++;
                if (t.completed) acc.completed++;
                return acc;
            },
            { total: 0, completed: 0 }
        );

        return {
            total,
            completed,
            active: total - completed,
            isEmpty: total === 0,
            allCompleted: total > 0 && completed === total,
        };
    }, [todos]);

    return {
        todos,
        filter,
        setFilter,
        addTodo,
        deleteTodo,
        undoDelete,
        toggleTodo,
        toggleAll,
        editTodo,
        reorderTodos,
        clearTodos,
        filteredTodos,
        stats,
    };
}