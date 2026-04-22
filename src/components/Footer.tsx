"use client";

import { useMemo, useCallback, useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

const TEXT = {
    empty: "タスクがありません",
    done: "すべて完了",
    almost: "もう少し",
    good: "進行中",
    started: "開始済み",
    notStarted: "未開始",
};

export default function Footer({
    total,
    completed,
    onClearCompleted,
    onRestore,
    showPercentage = true,
}: FooterProps) {
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    const remaining = total - completed;

    const progress = useMemo(() => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    }, [total, completed]);

    const status = useMemo(() => {
        if (total === 0) return { text: TEXT.empty, color: "bg-gray-400" };
        if (completed === total) return { text: TEXT.done, color: "bg-green-500" };
        if (progress >= 80) return { text: TEXT.almost, color: "bg-purple-500" };
        if (progress >= 50) return { text: TEXT.good, color: "bg-blue-500" };
        if (progress > 0) return { text: TEXT.started, color: "bg-blue-400" };
        return { text: TEXT.notStarted, color: "bg-gray-400" };
    }, [total, completed, progress]);

    const handleClear = useCallback(async () => {
        if (completed === 0) {
            toast.info("削除対象なし");
            return;
        }

        if (loadingRef.current) return;

        const confirmed = confirm("完了済みタスクを削除しますか？");
        if (!confirmed) return;

        try {
            loadingRef.current = true;
            setLoading(true);

            const removedTodos = await onClearCompleted();

            toast.success("削除しました", {
                description: `${removedTodos.length}件`,
                action: onRestore
                    ? {
                        label: "戻す",
                        onClick: () => {
                            onRestore(removedTodos);
                        },
                    }
                    : undefined,
            });
        } catch {
            toast.error("失敗しました");
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [completed, onClearCompleted, onRestore]);

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