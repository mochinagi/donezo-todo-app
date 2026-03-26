// Import Card and CardContent components from custom UI library / カスタムUIライブラリからCardとCardContentコンポーネントをインポート
import { Card, CardContent } from "@/components/ui/card";
// Import Trash and CheckCircle icons from lucide-react icon library / lucide-reactアイコンライブラリからゴミ箱とチェックサークルアイコンをインポート
import { Trash2, CheckCircle2 } from "lucide-react";
// Import Todo type definition (assumed to be the type for task objects) / Todo型定義をインポート（タスクオブジェクトの型と想定）
import { Todo } from "@/hooks/useTodoState";

// Define TodoList component, receiving list of todos and operation callbacks as props / TodoListコンポーネントを定義。タスク一覧と操作関数をpropsとして受け取る
export default function TodoList({
    todos,         // Array of tasks, type Todo[] / タスクの配列、型はTodo[]
    onToggle,      // Callback to toggle task completion status, receives task id / タスク完了状態を切り替えるコールバック、タスクのidを受け取る
    onDelete       // Callback to delete a task, receives task id / タスクを削除するコールバック、タスクのidを受け取る
}: {
    todos: Todo[];
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}) {
    // If no tasks, display a message / タスクがなければメッセージを表示
    if (todos.length === 0) {
        return <p className="text-center text-gray-500 mt-20">タスクがありません。</p>; // Japanese: No tasks / 日本語：「タスクがありません」
    }

    return (
        // Main container: flex layout fills space, vertical scroll, padding, white background, vertical gap, max width and centered / メインコンテナ：flexレイアウトでスペースを埋める、縦スクロール、パディング、白背景、縦の間隔、最大幅と中央寄せ
        <section className="flex-1 overflow-y-auto p-6 bg-white space-y-4 max-w-2xl mx-auto">

            {/* Map over todos array to generate a card for each task / todos配列をマップし、各タスクにカードを生成 */}
            {todos.map(todo => (
                // Card container: horizontal layout, space between content, rounded corners, border, shadow, hover shadow effect with animation / カードコンテナ：横並び、コンテンツ両端揃え、角丸、境界線、影、ホバー時の影エフェクト（アニメーション付き）
                <Card
                    key={todo.id}
                    className={`flex items-center justify-between rounded-md border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
  ${todo.completed ? "opacity-60 scale-[0.98]" : "opacity-100 scale-100"}`}
                >

                    {/* Card content container: horizontal layout, gap between items, padding, full width / カード内容コンテナ：横並び、アイテム間隔、パディング、幅いっぱい */}
                    <CardContent className="flex items-center gap-4 py-3 px-4 w-full">

                        {/* Button to toggle completion status / 完了状態を切り替えるボタン */}
                        <button
                            onClick={() => onToggle(todo.id)}  // On click, call onToggle to switch task completion status / クリック時にonToggleを呼び出し完了状態を切り替える
                            // Button styles based on completion: blue bg and white text if completed, gray bg and text if not, lighter gray on hover / 完了状態に応じたボタンスタイル：完了なら青背景白文字、未完了なら灰色背景と文字、ホバー時は薄い灰色
                            className={`p-1 rounded-full transition-all duration-200 active:scale-90 ${todo.completed ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                            aria-label={todo.completed ? "未完了に戻す" : "完了にする"} // Accessibility label: "Mark as incomplete" or "Mark as complete" / アクセシビリティ用ラベル：「未完了に戻す」または「完了にする」
                        >
                            {/* Check circle icon / チェックサークルアイコン */}
                            <CheckCircle2 size={20} />
                        </button>

                        {/* Task text content / タスクのテキスト内容 */}
                        <span
                            // Fill remaining space, disable text selection, break words automatically
                            // Completed tasks have line-through and gray text, incomplete tasks have dark text / 残りスペースを埋め、テキスト選択禁止、自動改行。完了済みは取り消し線と灰色文字、未完了は濃い文字
                            className={`flex-1 select-none break-words text-lg ${todo.completed ? "line-through text-gray-400" : "text-gray-900"}`}
                        >
                            {todo.text}  {/* Task text content / タスクのテキスト内容 */}
                        </span>

                        {/* Button to delete task / タスク削除ボタン */}
                        <button
                            onClick={() => {
                                if (confirm("本当に削除しますか？")) {
                                    onDelete(todo.id);
                                }
                            }}    // On click, call onDelete to remove task / クリック時にonDeleteを呼び出しタスクを削除
                            className="text-gray-400 hover:text-red-500 transition-colors" // Default gray text, red on hover / デフォルトは灰色文字、ホバー時は赤色
                            aria-label="タスクを削除"            // Accessibility label, Japanese: "Delete task" / アクセシビリティ用ラベル、日本語：「タスクを削除」
                        >
                            {/* Trash icon / ゴミ箱アイコン */}
                            <Trash2 size={20} />
                        </button>
                    </CardContent>
                </Card>
            ))}
        </section>
    );
}
