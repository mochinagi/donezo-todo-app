"use client";

import { memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, CheckCircle2 } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";

interface TodoProps {
    id: number;
    text: string;
    completed: boolean;
}

/**
 * TodoItem
 */
const TodoItem: React.FC<TodoProps> = memo(function TodoItem({ id, text, completed }) {
    const { toggleTodo, deleteTodo } = useTodoStore();

    const handleToggle = useCallback(() => toggleTodo(id), [id, toggleTodo]);
    const handleDelete = useCallback(() => {
        if (window.confirm("このタスクを削除しますか？")) {
            deleteTodo(id);
        }
    }, [id, deleteTodo]);

    const buttonClass = completed
        ? "bg-blue-600 text-white"
        : "bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300";

    const textClass = completed
        ? "line-through text-gray-400"
        : "text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400";

    return (
        <Card
            role="listitem"
            interactive
            className={`flex items-center justify-between transform transition-all duration-200
                ${completed ? "opacity-60 scale-[0.98]" : "hover:scale-[1.02]"}`}
        >
            <CardContent className="flex items-center gap-4 w-full">
                <button
                    onClick={handleToggle}
                    aria-pressed={completed}
                    aria-label={completed ? "未完了に戻す" : "完了にする"}
                    className={`p-2 rounded-full transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-400 ${buttonClass}`}
                >
                    <CheckCircle2 size={20} />
                </button>

                <span
                    onClick={handleToggle}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleToggle();
                    }}
                    aria-label={`タスク: ${text}. ${completed ? "完了済み" : "未完了"}`}
                    className={`flex-1 break-words text-lg cursor-pointer transition-colors ${textClass}`}
                >
                    {text}
                </span>

                <button
                    onClick={handleDelete}
                    aria-label="タスクを削除"
                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                >
                    <Trash2 size={20} />
                </button>
            </CardContent>
        </Card>
    );
});

/**
 * TodoList
 */
export default function TodoList() {
    const filteredTodos = useTodoStore((s) => s.filteredTodos());

    if (filteredTodos.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center mt-24 text-gray-500 space-y-3 animate-fade-in"
                aria-live="polite"
            >
                <CheckCircle2 size={40} className="opacity-30" />
                <p className="text-lg font-medium">タスクがまだありません</p>
                <p className="text-sm text-gray-400">最初のタスクを追加してみましょう 🚀</p>
            </div>
        );
    }

    return (
        <section
            role="list"
            className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-950 space-y-4 max-w-2xl mx-auto"
        >
            {filteredTodos.map((todo) => (
                <TodoItem key={todo.id} {...todo} />
            ))}
        </section>
    );
}