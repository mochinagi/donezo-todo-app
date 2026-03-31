import { useState, useEffect, useMemo } from "react";

/**
 * Todo型定義
 */
export interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

/**
 * localStorageキー
 */
const STORAGE_KEY = "todos";

/**
 * カスタムフック
 */
export function useTodoState() {

    /**
     * 初期データ取得（安全版）
     */
    const getInitialTodos = (): Todo[] => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            console.warn("Failed to parse todos from localStorage");
            return [];
        }
    };

    /**
     * State
     */
    const [todos, setTodos] = useState<Todo[]>(getInitialTodos);
    const [input, setInput] = useState("");
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("tasks");

    /**
     * 保存（todos変更時）
     */
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }, [todos]);

    /**
     * タスク追加
     */
    const addTodo = () => {
        const text = input.trim();
        if (!text) return;

        const newTodo: Todo = {
            id: Date.now(),
            text,
            completed: false,
        };

        setTodos(prev => [newTodo, ...prev]);
        setInput("");
    };

    /**
     * 完了切り替え
     */
    const toggleTodo = (id: number) => {
        setTodos(prev =>
            prev.map(todo =>
                todo.id === id
                    ? { ...todo, completed: !todo.completed }
                    : todo
            )
        );
    };

    /**
     * 削除
     */
    const deleteTodo = (id: number) => {
        setTodos(prev => prev.filter(todo => todo.id !== id));
    };

    /**
     * 完了削除
     */
    const clearCompleted = () => {
        setTodos(prev => prev.filter(todo => !todo.completed));
    };

    /**
     * カテゴリフィルター
     */
    const categoryFilteredTodos = useMemo(() => {
        switch (activeCategory) {
            case "important":
                // 仮：将来フラグ追加予定
                return todos;
            case "planned":
                return todos;
            case "myday":
                return todos;
            case "tasks":
            default:
                return todos;
        }
    }, [todos, activeCategory]);

    /**
     * 検索フィルター
     */
    const filteredTodos = useMemo(() => {
        return categoryFilteredTodos.filter(todo =>
            todo.text.toLowerCase().includes(search.toLowerCase())
        );
    }, [categoryFilteredTodos, search]);

    /**
     * 統計（面試加分🔥）
     */
    const stats = useMemo(() => {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const active = total - completed;

        return { total, completed, active };
    }, [todos]);

    return {
        // state
        todos,
        input,
        search,
        activeCategory,

        // setters
        setInput,
        setSearch,
        setActiveCategory,

        // derived
        filteredTodos,
        stats,

        // actions
        addTodo,
        toggleTodo,
        deleteTodo,
        clearCompleted,
    };
}