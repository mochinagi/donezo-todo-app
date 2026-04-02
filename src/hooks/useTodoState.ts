import { useState, useCallback } from "react";

/* -----------------------------
   Todo型定義
----------------------------- */
export interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

/* -----------------------------
   フィルタタイプ定義
----------------------------- */
export type FilterType = "all" | "completed" | "active";

/* -----------------------------
   useTodoState Hook
   Todo状態管理フック
----------------------------- */
export function useTodoState(initialTodos: Todo[] = []) {
    const [todos, setTodos] = useState<Todo[]>(initialTodos);

    /* -----------------------------
       タスク追加
    ----------------------------- */
    const addTodo = useCallback((text: string) => {
        const newTodo: Todo = {
            id: Date.now(),
            text,
            completed: false,
        };
        setTodos((prev) => [...prev, newTodo]);
    }, []);

    /* -----------------------------
       タスク削除
    ----------------------------- */
    const deleteTodo = useCallback((id: number) => {
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
    }, []);

    /* -----------------------------
       完了状態切替
    ----------------------------- */
    const toggleTodo = useCallback((id: number) => {
        setTodos((prev) =>
            prev.map((todo) =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );
    }, []);

    /* -----------------------------
       全タスク削除
    ----------------------------- */
    const clearTodos = useCallback(() => {
        setTodos([]);
    }, []);

    /* -----------------------------
       フィルタ済みタスク取得
    ----------------------------- */
    const filteredTodos = useCallback(
        (filter: FilterType = "all") => {
            switch (filter) {
                case "completed":
                    return todos.filter((todo) => todo.completed);
                case "active":
                    return todos.filter((todo) => !todo.completed);
                default:
                    return todos;
            }
        },
        [todos]
    );

    return {
        todos,
        addTodo,
        deleteTodo,
        toggleTodo,
        clearTodos,
        filteredTodos,
    };
}