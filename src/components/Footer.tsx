// Define a Footer component that displays task stats and a "clear completed" button / タスクの統計情報と「完了済みをクリア」ボタンを表示するFooterコンポーネントを定義
export default function Footer({
    total,                // Total number of tasks / タスクの総数
    completed,            // Number of completed tasks / 完了したタスクの数
    onClearCompleted      // Function triggered when the "Clear Completed" button is clicked / 「完了済みをクリア」ボタンがクリックされたときに実行される関数
}: {
    total: number;
    completed: number;
    onClearCompleted: () => void;
}) {
    return (
        // Footer container with white background, top border, padding, space-between layout, and text styles / 白背景、上部ボーダー、パディング、両端揃えのレイアウト、テキストスタイルを持つフッターコンテナ
        <footer className="bg-white border-t border-gray-300 px-6 py-3 flex justify-between text-sm text-gray-600 max-w-2xl mx-auto">

            {/* Display total and completed tasks, in Japanese: “X tasks, Y completed” / 総タスク数と完了数を表示。日本語：「Xタスク、Y完了済み」 */}
            <div>{total} タスク, {completed} 完了済み</div>

            {/* Show "Clear Completed" button only if completed > 0 / completedが0より大きいときのみ「完了済みをクリア」ボタンを表示 */}
            {completed > 0 && (
                <button
                    onClick={onClearCompleted}     // Call onClearCompleted when the button is clicked / ボタンがクリックされたときにonClearCompletedを実行
                    className="text-blue-600 hover:underline" // Blue text with underline on hover / ホバー時に下線が表示される青色テキスト
                >
                    完了済みをクリア  {/* Button text: "Clear Completed" in Japanese / ボタンのテキスト：「完了済みをクリア」 */}
                </button>
            )}
        </footer>
    );
}
