"use client";

/**
 * Footer Component
 * タスク統計と完了操作
 */

import { useMemo, useCallback } from "react";
import { toast } from "sonner";

/* ================= TYPES ================= */

type Todo = {
    id: number;
    text: string;
    completed: boolean;
};

interface FooterProps {
    total: number;
    completed: number;
    onClearCompleted: () => Todo[];
    onRestore?: (todos: Todo[]) => void;
    showPercentage?: boolean;
}

/* ================= COMPONENT ================= */

export default function Footer({
    total,
    completed,
    onClearCompleted,
    onRestore,
    showPercentage = true,
}: FooterProps) {

    /* -----------------------------
       derived state（整理版）
    ----------------------------- */
    const remaining = total - completed;

    const progress = useMemo(() => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    }, [total, completed]);

    const statusText = useMemo(() => {
        if (total === 0) return "タスクを追加してみましょう ✨";
        if (completed === total) return "🎉 すべて完了！素晴らしい！";
        if (progress >= 80) return "あと少しで完了！🔥";
        if (progress >= 50) return "順調に進んでいます 👍";
        if (progress > 0) return "スタートしました 💡";
        return "まだ始まっていません";
    }, [total, completed, progress]);

    const progressColor = useMemo(() => {
        if (completed === total && total > 0) return "bg-green-500";
        if (progress >= 80) return "bg-purple-500";
        return "bg-blue-500";
    }, [completed, total, progress]);

    /* -----------------------------
       clear completed（真实 undo🔥）
    ----------------------------- */
    const handleClear = useCallback(() => {
        if (completed === 0) return;

        // 👉 先执行删除
        const removed = onClearCompleted();

        toast.success("完了済みタスクを削除しました", {
            action: onRestore
                ? {
                    label: "元に戻す",
                    onClick: () => {
                        onRestore(removed);
                        toast.success("復元しました");
                    },
                }
                : undefined,
        });
    }, [completed, onClearCompleted, onRestore]);

    return (
        <footer
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur
            border-t border-gray-200 dark:border-gray-700
            px-6 py-4 space-y-4 max-w-2xl mx-auto"
        >
            {/* 統計 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 dark:text-gray-300 gap-2">
                <span>
                    {total}件中 {completed}件完了（残り {remaining}件）
                </span>

                <button
                    onClick={handleClear}
                    disabled={completed === 0}
                    className="px-3 py-1 rounded-md text-red-500
                    hover:bg-red-50 dark:hover:bg-red-900/30
                    transition-all duration-200
                    hover:scale-105 active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-red-300
                    disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="完了済みタスクを削除"
                >
                    完了済みをクリア
                </button>
            </div>

            {/* 進捗バー */}
            <div
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
                role="progressbar"
                aria-label="タスク進捗"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                    style={{
                        width: `${progress}%`,
                        opacity: total === 0 ? 0.3 : 1,
                    }}
                />
            </div>

            {/* 状态 */}
            <div className="flex justify-between text-xs text-gray-400">
                <span>{statusText}</span>
                {showPercentage && <span>進捗: {progress}%</span>}
            </div>
        </footer>
    );
}