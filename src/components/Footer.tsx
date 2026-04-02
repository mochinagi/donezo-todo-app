"use client";

/**
 * Footer Component
 * タスク統計と完了操作
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
    const remaining = total - completed;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    // 进度条颜色渐变
    const progressColor =
        progress === 100 ? "bg-green-500" :
            progress >= 80 ? "bg-purple-500" :
                "bg-blue-500";

    return (
        <footer className="bg-white border-t border-gray-200 px-6 py-4 space-y-3 max-w-2xl mx-auto">

            {/* 統計情報 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 gap-2">
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
                        className="px-3 py-1 rounded-md text-red-500 hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                        aria-label="完了済みタスクを削除"
                        tabIndex={0}
                    >
                        完了済みをクリア
                    </button>
                )}
            </div>

            {/* 進捗バー */}
            <div
                className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={`h-full ${progressColor} transition-all duration-500 ease-in-out`}
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