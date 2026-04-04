import { useState, useCallback, useMemo, useEffect, useRef } from "react";

/* -----------------------------
   Todo型定義
----------------------------- */
export interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

/* -----------------------------
   フィルタタイプ定義
----------------------------- */
export type FilterType = "all" | "completed" | "active";

/* -----------------------------
   localStorage key
----------------------------- */
const STORAGE_KEY = "donezo-todos";

/* -----------------------------
   Hook
----------------------------- */
export function useTodoState(initialTodos: Todo[] = []) {
    /* -----------------------------
       初期化（localStorage優先）
    ----------------------------- */
    const [todos, setTodos] = useState<Todo[]>(() => {
        if (typeof window === "undefined") return initialTodos;

        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : initialTodos;
    });

    const [filter, setFilter] = useState<FilterType>("all");

    /* -----------------------------
       Undo用
    ----------------------------- */
    const lastDeleted = useRef<Todo | null>(null);

    /* -----------------------------
       保存（自動）
    ----------------------------- */
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }, [todos]);

    /* -----------------------------
       タスク追加
    ----------------------------- */
    const addTodo = useCallback((text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const newTodo: Todo = {
            id: crypto.randomUUID(),
            text: trimmed,
            completed: false,
        };

        setTodos((prev) => [...prev, newTodo]);
    }, []);

    /* -----------------------------
       タスク削除（Undo対応）
    ----------------------------- */
    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => {
            const target = prev.find((t) => t.id === id);
            if (target) lastDeleted.current = target;

            return prev.filter((todo) => todo.id !== id);
        });
    }, []);

    /* -----------------------------
       Undo
    ----------------------------- */
    const undoDelete = useCallback(() => {
        if (!lastDeleted.current) return;

        setTodos((prev) => [...prev, lastDeleted.current!]);
        lastDeleted.current = null;
    }, []);

    /* -----------------------------
       完了状態切替
    ----------------------------- */
    const toggleTodo = useCallback((id: string) => {
        setTodos((prev) =>
            prev.map((todo) =>
                todo.id === id
                    ? { ...todo, completed: !todo.completed }
                    : todo
            )
        );
    }, []);

    /* -----------------------------
       全部トグル
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
            prev.map((todo) =>
                todo.id === id ? { ...todo, text: trimmed } : todo
            )
        );
    }, []);

    /* -----------------------------
       並び替え（DnD用）
    ----------------------------- */
    const reorderTodos = useCallback((newTodos: Todo[]) => {
        setTodos(newTodos);
    }, []);

    /* -----------------------------
       全削除
    ----------------------------- */
    const clearTodos = useCallback(() => {
        setTodos([]);
    }, []);

    /* -----------------------------
       フィルタ済み
    ----------------------------- */
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

    /* -----------------------------
       統計（1回ループで計算）
    ----------------------------- */
    const stats = useMemo(() => {
        let completed = 0;

        for (const t of todos) {
            if (t.completed) completed++;
        }

        const total = todos.length;
        const active = total - completed;

        return { total, completed, active };
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