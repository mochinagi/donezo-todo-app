import { useState, useEffect } from "react"; // useEffectを追加

// タスクの型定義
export interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

// タスクの状態管理カスタムフック
export function useTodoState() {

    // タスクリスト
    const [todos, setTodos] = useState<Todo[]>([]);

    // 初回レンダリング時にlocalStorageから読み込み
    useEffect(() => {
        const saved = localStorage.getItem("todos");
        if (saved) {
            setTodos(JSON.parse(saved));
        }
    }, []);

    // 入力フィールド
    const [input, setInput] = useState("");

    // 検索フィールド
    const [search, setSearch] = useState("");

    // カテゴリ（今は未使用でもOK）
    const [activeCategory, setActiveCategory] = useState("tasks");

    // 検索フィルター
    const filteredTodos = todos.filter(todo =>
        todo.text.toLowerCase().includes(search.toLowerCase())
    );

    // タスク追加
    const addTodo = () => {

        // 空入力防止
        if (!input.trim()) return;

        const newTodo: Todo = {
            id: Date.now(),
            text: input,
            completed: false,
        };

        setTodos([newTodo, ...todos]);
        setInput("");
    };

    // 完了状態切り替え
    const toggleTodo = (id: number) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    // 削除
    const deleteTodo = (id: number) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };

    // 完了タスク削除
    const clearCompleted = () => {
        setTodos(todos.filter(todo => !todo.completed));
    };

    // ⭐ここが正解位置（超重要）
    // todosが変更されるたびにlocalStorageへ保存
    useEffect(() => {
        localStorage.setItem("todos", JSON.stringify(todos));
    }, [todos]);

    return {
        todos, setTodos,
        input, setInput,
        search, setSearch,
        activeCategory, setActiveCategory,
        filteredTodos,
        addTodo,
        toggleTodo,
        deleteTodo,
        clearCompleted
    };
}