"use client";

/**
 * Footer Component
 * タスク統計と完了操作
 */

import { useMemo, useCallback } from "react";
import { toast } from "sonner";

export default function Footer({
    total,
    completed,
    onClearCompleted,
}: {
    total: number;
    completed: number;
    onClearCompleted: () => void;
}) {
    /* -----------------------------
       derived state
    ----------------------------- */
    const { remaining, progress, statusText, progressColor } = useMemo(() => {
        const remaining = total - completed;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        let statusText = "まだ始まっていません";
        if (progress === 100) statusText = "🎉 すべて完了！";
        else if (progress >= 80) statusText = "もう少しで完了！";
        else if (progress >= 50) statusText = "順調に進んでいます";
        else if (progress > 0) statusText = "スタートしました";

        const progressColor =
            progress === 100
                ? "bg-green-500"
                : progress >= 80
                    ? "bg-purple-500"
                    : "bg-blue-500";

        return { remaining, progress, statusText, progressColor };
    }, [total, completed]);

    /* -----------------------------
       clear completed（带反馈）
    ----------------------------- */
    const handleClear = useCallback(() => {
        if (completed === 0) return;

        onClearCompleted();

        toast.success("完了済みタスクを削除しました", {
            description: "必要ならUndoできます（今后可以扩展）",
        });
    }, [completed, onClearCompleted]);

    return (
        <footer className="bg-white border-t border-gray-200 px-6 py-4 space-y-4 max-w-2xl mx-auto">
            {/* 統計 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 gap-2">
                <span>
                    {total}件中 {completed}件完了（残り {remaining}件）
                </span>

                {completed > 0 && (
                    <button
                        onClick={handleClear}
                        className="px-3 py-1 rounded-md text-red-500 hover:bg-red-50 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300"
                        aria-label="完了済みタスクを削除"
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
                    className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* 进度 & 状态 */}
            <div className="flex justify-between text-xs text-gray-400">
                <span>{statusText}</span>
                <span>進捗: {progress}%</span>
            </div>
        </footer>
    );
}