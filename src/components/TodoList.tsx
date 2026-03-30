import { Card, CardContent } from "@/components/ui/card";
import { Trash2, CheckCircle2 } from "lucide-react";
import { Todo } from "@/hooks/useTodoState";

/**
 * 単一のTodoアイテムコンポーネント
 * 表示・操作（完了/削除）を担当
 */
function TodoItem({
    todo,
    onToggle,
    onDelete
}: {
    todo: Todo;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}) {
    return (
        <Card
            role="listitem"
            className={`flex items-center justify-between rounded-xl border border-gray-200 shadow-sm 
            hover:shadow-lg hover:-translate-y-1 transition-all duration-200
            ${todo.completed ? "opacity-60 scale-[0.98]" : ""}`}
        >
            <CardContent className="flex items-center gap-4 py-3 px-4 w-full">

                {/* 完了状態を切り替えるボタン */}
                <button
                    onClick={() => onToggle(todo.id)}
                    className={`p-2 rounded-full transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-400
                    ${todo.completed
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                        }`}
                    aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
                >
                    <CheckCircle2 size={20} />
                </button>

                {/* タスク内容表示 */}
                <span
                    className={`flex-1 select-none break-words text-lg transition-colors
                    ${todo.completed
                            ? "line-through text-gray-400"
                            : "text-gray-900"
                        }`}
                >
                    {todo.text}
                </span>

                {/* タスク削除ボタン */}
                <button
                    onClick={() => {
                        if (confirm("このタスクを削除しますか？")) {
                            onDelete(todo.id);
                        }
                    }}
                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    aria-label="タスクを削除"
                >
                    <Trash2 size={20} />
                </button>
            </CardContent>
        </Card>
    );
}

/**
 * Todo一覧コンポーネント
 * Todo配列を受け取り、リストとして描画する
 */
export default function TodoList({
    todos,
    onToggle,
    onDelete
}: {
    todos: Todo[];
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}) {

    // タスクが存在しない場合の表示（空状態）
    if (todos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center mt-24 text-gray-500 space-y-3">
                <CheckCircle2 size={40} className="opacity-30" />
                <p className="text-lg">タスクがまだありません</p>
                <p className="text-sm text-gray-400">
                    新しいタスクを追加してみましょう ✨
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