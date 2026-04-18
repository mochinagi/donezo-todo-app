"use client";

/**
 * Footer Component
 * タスク統計と完了操作
 */

import { useMemo, useCallback, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/* ================= TYPES ================= */

type Todo = {
    id: number;
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

    const remaining = total - completed;

    const progress = useMemo(() => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    }, [total, completed]);

    const status = useMemo(() => {
        if (total === 0)
            return {
                text: "タスクを追加してみましょう ✨",
                color: "bg-gray-400",
            };

        if (completed === total)
            return {
                text: "🎉 すべて完了！素晴らしい！",
                color: "bg-green-500",
            };

        if (progress >= 80)
            return {
                text: "あと少しで完了！🔥",
                color: "bg-purple-500",
            };

        if (progress >= 50)
            return {
                text: "順調に進んでいます 👍",
                color: "bg-blue-500",
            };

        if (progress > 0)
            return {
                text: "スタートしました 💡",
                color: "bg-blue-400",
            };

        return {
            text: "まだ始まっていません",
            color: "bg-gray-400",
        };
    }, [total, completed, progress]);

    /* ---------------- CLEAR ---------------- */

    const handleClear = useCallback(async () => {
        if (completed === 0) {
            toast.info("削除できる完了タスクがありません");
            return;
        }

        if (loading) return;

        try {
            setLoading(true);

            const removedTodos = await onClearCompleted();

            toast.success("完了済みタスクを削除しました", {
                description: `${removedTodos.length}件削除されました`,
                action: onRestore
                    ? {
                        label: "元に戻す",
                        onClick: () => {
                            onRestore?.(removedTodos);
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
    }, [completed, loading, onClearCompleted, onRestore]);

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
                    className="flex items-center gap-1 px-3 py-1 rounded-md text-red-500
                    hover:bg-red-50 dark:hover:bg-red-900/30
                    transition-all duration-200
                    hover:scale-105 active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-red-300
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading && <Loader2 size={14} className="animate-spin" />}
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
                    className={`h-full ${status.color} transition-all duration-500 ease-out`}
                    style={{
                        width: `${progress}%`,
                        opacity: total === 0 ? 0.3 : 1,
                    }}
                />
            </div>

            {/* 状态 */}
            <div className="flex justify-between text-xs text-gray-400">
                <span>{status.text}</span>
                {showPercentage && <span>進捗: {progress}%</span>}
            </div>
        </footer>
    );
}