"use client";

/**
 * Footer Component
 * タスク統計と完了操作
 */

import { useMemo, useCallback, useState } from "react";
import { toast } from "sonner";

/* ================= TYPES ================= */

type Todo = {
    id: string;
    text: string;
    completed: boolean;
};

interface FooterProps {
    total: number;
    completed: number;
    onClearCompleted: () => Todo[] | Promise<Todo[]>;
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
    const [loading, setLoading] = useState(false);

    /* ---------------- DERIVED ---------------- */

    const { remaining, progress, statusText, progressColor } = useMemo(() => {
        const remaining = total - completed;

        const progress =
            total === 0 ? 0 : Math.round((completed / total) * 100);

        let statusText = "まだ始まっていません";

        if (total === 0) statusText = "タスクを追加してみましょう ✨";
        else if (completed === total)
            statusText = "🎉 すべて完了！素晴らしい！";
        else if (progress >= 80) statusText = "あと少しで完了！🔥";
        else if (progress >= 50) statusText = "順調に進んでいます 👍";
        else if (progress > 0) statusText = "スタートしました 💡";

        let progressColor = "bg-blue-500";
        if (completed === total && total > 0) progressColor = "bg-green-500";
        else if (progress >= 80) progressColor = "bg-purple-500";

        return { remaining, progress, statusText, progressColor };
    }, [total, completed]);

    /* ---------------- CLEAR ---------------- */

    const handleClear = useCallback(async () => {
        if (completed === 0 || loading) return;

        try {
            setLoading(true);

            const removedTodos = await onClearCompleted();

            toast.success("完了済みタスクを削除しました", {
                description: `${removedTodos.length}件削除されました`,
                action: onRestore
                    ? {
                        label: "元に戻す",
                        onClick: () => {
                            onRestore(removedTodos);
                            toast.success("復元しました");
                        },
                    }
                    : undefined,
            });
        } catch {
            toast.error("削除に失敗しました");
        } finally {
            setLoading(false);
        }
    }, [completed, onClearCompleted, onRestore, loading]);

    return (
        <footer
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur
            border-t border-gray-200 dark:border-gray-700
            px-6 py-4 space-y-4 max-w-2xl mx-auto"
        >
            {/* 統計 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 dark:text-gray-300 gap-2">
                <span aria-live="polite">
                    {total}件中 {completed}件完了（残り {remaining}件）
                </span>

                <button
                    onClick={handleClear}
                    disabled={completed === 0 || loading}
                    aria-label="完了済みタスクを削除"
                    className="px-3 py-1 rounded-md text-red-500
                    hover:bg-red-50 dark:hover:bg-red-900/30
                    transition-all duration-200
                    hover:scale-105 active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-red-300
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading ? "削除中..." : "完了済みをクリア"}
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