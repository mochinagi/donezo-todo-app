/**
 * フッターコンポーネント
 * タスクの統計情報と操作（完了削除）を表示
 */
export default function Footer({
    total,
    completed,
    onClearCompleted
}: {
    total: number;
    completed: number;
    onClearCompleted: () => void;
}) {

    // 未完了タスク数
    const remaining = total - completed;

    // 進捗率（%）
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <footer className="bg-white border-t border-gray-200 px-6 py-4 space-y-3 max-w-2xl mx-auto">

            {/* 統計情報 */}
            <div className="flex justify-between text-sm text-gray-600">
                <span>
                    {total}件中 {completed}件完了（残り {remaining}件）
                </span>

                {completed > 0 && (
                    <button
                        onClick={() => {
                            if (confirm("完了済みのタスクをすべて削除しますか？")) {
                                onClearCompleted();
                            }
                        }}
                        className="px-3 py-1 rounded-md text-red-500 hover:bg-red-50 transition"
                        aria-label="完了済みタスクを削除"
                    >
                        完了済みをクリア
                    </button>
                )}
            </div>

            {/* 進捗バー */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* 進捗テキスト */}
            <div className="text-xs text-gray-400 text-right">
                進捗: {progress}%
            </div>
        </footer>
    );
}