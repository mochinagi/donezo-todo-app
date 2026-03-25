import { useState } from "react";

// Definition of the task type, each task has an id, text content, and completion status
// タスクの型定義。各タスクにはid、テキスト内容、完了状態がある
export interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

// Custom hook that encapsulates task-related state and operations
// タスクに関連する状態と操作をカプセル化したカスタムフック
export function useTodoState() {
    // todos: List of tasks, initially an empty array
    // todos：タスクリスト。初期値は空の配列
    const [todos, setTodos] = useState<Todo[]>([]);

    // input: Input field value for adding new tasks, initially an empty string
    // input：新しいタスクを追加するための入力フィールドの値。初期値は空文字
    const [input, setInput] = useState("");

    // search: Search field value for filtering tasks, initially an empty string
    // search：タスクをフィルタリングするための検索フィールドの値。初期値は空文字
    const [search, setSearch] = useState("");

    // activeCategory: Currently selected task category, default is 'tasks'
    // activeCategory：現在選択されているタスクカテゴリ。デフォルトは'tasks'
    const [activeCategory, setActiveCategory] = useState("tasks");

    // Filter tasks based on search input, only show tasks containing the keyword
    // 検索入力に基づいてタスクをフィルタリング。キーワードを含むタスクのみ表示
    const filteredTodos = todos.filter(todo =>
        todo.text.toLowerCase().includes(search.toLowerCase())
    );

    // Function to add a new task
    // 新しいタスクを追加する関数
    const addTodo = () => {
        // If input is empty or just whitespace, do nothing
        // 入力が空または空白のみなら何もしない
        if (!input.trim()) return;

        // Create a new task object. Use timestamp as id, input as text, and set completed to false
        // 新しいタスクオブジェクトを作成。idはタイムスタンプ、textは入力値、completedはfalse
        const newTodo: Todo = {
            id: Date.now(),
            text: input,
            completed: false,
        };

        // Add the new task to the beginning of the list (latest tasks at the top)
        // 新しいタスクをリストの先頭に追加（新しいタスクが上に来る）
        setTodos([newTodo, ...todos]);

        // Clear the input field after adding
        // 追加後に入力フィールドをクリア
        setInput("");
    };

    // Toggle task completion status by id
    // idで指定されたタスクの完了状態を切り替える
    const toggleTodo = (id: number) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    // Delete a task by filtering out the task with the matching id
    // 指定されたidのタスクを除外して削除
    const deleteTodo = (id: number) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };

    // Clear all tasks that are marked as completed
    // 完了済みのすべてのタスクを削除
    const clearCompleted = () => {
        setTodos(todos.filter(todo => !todo.completed));
    };

    // Return all states and functions for use in components
    // すべての状態と関数を返して、コンポーネントで使用可能にする
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
