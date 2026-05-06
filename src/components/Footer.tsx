"use client";

import { useMemo, useCallback, useState } from "react";
import { toast } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

/* ================= types ================= */

type Todo = {
    id: string;
    text: string;
    completed: boolean;
};

interface FooterProps {
    total: number;
    completed: number;
    onClearCompleted: () => Promise<Todo[]>;
    onRestore?: (todos: Todo[]) => void;
    showPercentage?: boolean;
}

/* ================= utils ================= */

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

const computeProgress = (total: number, completed: number) => {
    if (total === 0) return 0;
    return clamp(Math.round((completed / total) * 100), 0, 100);
};

const getStatus = (total: number, progress: number) => {
    if (total === 0) return { text: "タスクがありません", color: "bg-gray-400" };
    if (progress === 100) return { text: "すべて完了", color: "bg-green-500" };
    if (progress >= 80) return { text: "もう少し", color: "bg-purple-500" };
    if (progress >= 50) return { text: "進行中", color: "bg-blue-500" };
    if (progress > 0) return { text: "開始済み", color: "bg-blue-400" };
    return { text: "未開始", color: "bg-gray-400" };
};

/* ================= component ================= */

export default function Footer({
    total,
    completed,
    onClearCompleted,
    onRestore,
    showPercentage = true,
}: FooterProps) {
    const [loading, setLoading] = useState(false);

    const remaining = total - completed;

    const progress = useMemo(
        () => computeProgress(total, completed),
        [total, completed]
    );

    const status = useMemo(
        () => getStatus(total, progress),
        [total, progress]
    );

    const handleClear = useCallback(async () => {
        if (completed === 0 || loading) {
            toast.info("削除対象なし");
            return;
        }

        toast.action("完了済みタスクを削除しますか？", "削除", async () => {
            try {
                setLoading(true);

                const removed = await onClearCompleted();

                toast.success(
                    "削除しました",
                    `${removed.length}件`,
                    { id: "clear-success" }
                );

                if (onRestore && removed.length > 0) {
                    toast.action(
                        "元に戻す",
                        "戻す",
                        () => onRestore(removed),
                        { id: "restore-action" }
                    );
                }
            } catch {
                toast.error("削除に失敗しました");
            } finally {
                setLoading(false);
            }
        });
    }, [completed, loading, onClearCompleted, onRestore]);

    return (
        <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-t border-gray-200 dark:border-gray-700 px-6 py-4 space-y-4 max-w-2xl mx-auto">

            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                <span aria-live="polite">
                    {total}件中 {completed}件（残り {remaining}件）
                </span>

                <button
                    onClick={handleClear}
                    disabled={completed === 0 || loading}
                    className="flex items-center gap-1 px-3 py-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-40"
                >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    {loading ? "削除中" : "完了を削除"}
                </button>
            </div>

            <div
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={`${status.color} h-full transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-gray-400">
                <span>{status.text}</span>
                {showPercentage && <span>{progress}%</span>}
            </div>
        </footer>
    );
}