import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, CheckCircle2 } from "lucide-react";
import { Todo } from "@/hooks/useTodoState";

/**
 * TodoItem Props
 */
type TodoItemProps = {
    todo: Todo;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
};

/**
 * 単一Todoアイテム
 */
const TodoItem = memo(function TodoItem({
    todo,
    onToggle,
    onDelete
}: TodoItemProps) {
    const handleDelete = () => {
        if (window.confirm("このタスクを削除しますか？")) {
            onDelete(todo.id);
        }
    };

    return (
        <Card
            role="listitem"
            className={`flex items-center justify-between rounded-xl border border-gray-200 shadow-sm 
            hover:shadow-lg hover:-translate-y-1 transition-all duration-200
            ${todo.completed ? "opacity-60 scale-[0.98]" : ""}`}
        >
            <CardContent className="flex items-center gap-4 py-3 px-4 w-full">

                {/* 完了ボタン */}
                <button
                    onClick={() => onToggle(todo.id)}
                    aria-pressed={todo.completed}
                    aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
                    className={`p-2 rounded-full transition-all duration-200 active:scale-90
                    focus:outline-none focus:ring-2 focus:ring-blue-400
                    ${todo.completed
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                        }`}
                >
                    <CheckCircle2 size={20} />
                </button>

                {/* テキスト */}
                <span
                    className={`flex-1 select-none break-words text-lg transition-colors
                    ${todo.completed
                            ? "line-through text-gray-400"
                            : "text-gray-900"
                        }`}
                >
                    {todo.text}
                </span>

                {/* 削除 */}
                <button
                    onClick={handleDelete}
                    aria-label="タスクを削除"
                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                    <Trash2 size={20} />
                </button>
            </CardContent>
        </Card>
    );
});

/**
 * TodoList Props
 */
type TodoListProps = {
    todos: Todo[];
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
};

/**
 * Todo一覧
 */
export default function TodoList({
    todos,
    onToggle,
    onDelete
}: TodoListProps) {

    // 空状態
    if (todos.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center mt-24 text-gray-500 space-y-3"
                aria-live="polite"
            >
                <CheckCircle2 size={40} className="opacity-30" />
                <p className="text-lg font-medium">タスクがまだありません</p>
                <p className="text-sm text-gray-400">
                    最初のタスクを追加してみましょう 🚀
                </p>
            </div>
        );
    }

    return (
        <section
            role="list"
            className="flex-1 overflow-y-auto p-6 bg-white space-y-4 max-w-2xl mx-auto"
        >
            {todos.map((todo) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                />
            ))}
        </section>
    );
}