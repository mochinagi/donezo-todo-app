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
       Undo Stack（複数対応）
    ----------------------------- */
    const undoStack = useRef<Todo[]>([]);

    /* -----------------------------
       保存（軽量debounce）
    ----------------------------- */
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        }, 300);
    }, [todos]);

    /* -----------------------------
       追加
    ----------------------------- */
    const addTodo = useCallback((text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setTodos((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                text: trimmed,
                completed: false,
            },
        ]);
    }, []);

    /* -----------------------------
       削除（Undo stack）
    ----------------------------- */
    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const target = prev.find((t) => t.id === id);
            if (target) undoStack.current.push(target);

            return prev.filter((t) => t.id !== id);
        });
    }, []);

    /* -----------------------------
       Undo（複数）
    ----------------------------- */
    const undoDelete = useCallback(() => {
        const last = undoStack.current.pop();
        if (!last) return;

        setTodos((prev) => [...prev, last]);
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
       並び替え（改善版）
    ----------------------------- */
    const reorderTodos = useCallback((from: number, to: number) => {
        setTodos((prev) => {
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
       フィルタ
    ----------------------------- */
    const filteredTodos = useMemo(() => {
        if (filter === "completed") return todos.filter((t) => t.completed);
        if (filter === "active") return todos.filter((t) => !t.completed);
        return todos;
    }, [todos, filter]);

    /* -----------------------------
       統計 + 派生状態
    ----------------------------- */
    const stats = useMemo(() => {
        let completed = 0;

        for (const t of todos) {
            if (t.completed) completed++;
        }

        const total = todos.length;
        const active = total - completed;

        return {
            total,
            completed,
            active,
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