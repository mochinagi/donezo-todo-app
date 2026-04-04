import { useState, useCallback, useMemo } from "react";

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
   useTodoState Hook
----------------------------- */
export function useTodoState(initialTodos: Todo[] = []) {
    const [todos, setTodos] = useState<Todo[]>(initialTodos);
    const [filter, setFilter] = useState<FilterType>("all");

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
       タスク削除
    ----------------------------- */
    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
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
       統計（面試加分）
    ----------------------------- */
    const stats = useMemo(() => {
        const total = todos.length;
        const completed = todos.filter((t) => t.completed).length;
        const active = total - completed;

        return { total, completed, active };
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
        clearTodos,
        filteredTodos,
        stats,
    };
}