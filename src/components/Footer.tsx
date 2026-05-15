"use client";

import {
    useCallback,
    useMemo,
    useState,
} from "react";

import clsx from "clsx";

import { Loader2 } from "lucide-react";

import { toast } from "@/components/ui/toaster";

type Todo = {
    id: string;
    text: string;
    completed: boolean;
};

type FooterProps = {
    total: number;
    completed: number;

    onClearCompleted: () => Promise<Todo[]>;

    onRestore?: (
        todos: Todo[]
    ) => void;

    showPercentage?: boolean;
};

const getProgress = (
    total: number,
    completed: number
) => {
    if (total === 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(
            0,
            Math.round(
                (
                    completed /
                    total
                ) * 100
            )
        )
    );
};

export default function Footer({
    total,
    completed,
    onClearCompleted,
    onRestore,
    showPercentage = true,
}: FooterProps) {
    const [loading, setLoading] =
        useState(false);

    const remaining =
        total - completed;

    const progress =
        useMemo(() => {
            return getProgress(
                total,
                completed
            );
        }, [
            total,
            completed,
        ]);

    const statusText =
        useMemo(() => {
            if (total === 0) {
                return "タスクがありません";
            }

            if (progress === 100) {
                return "すべて完了";
            }

            if (progress >= 70) {
                return "進行中";
            }

            if (progress > 0) {
                return "作業中";
            }

            return "未開始";
        }, [
            total,
            progress,
        ]);

    const progressColor =
        useMemo(() => {
            if (progress === 100) {
                return "bg-emerald-500";
            }

            if (progress >= 70) {
                return "bg-blue-500";
            }

            if (progress > 0) {
                return "bg-sky-400";
            }

            return "bg-zinc-400";
        }, [progress]);

    const handleClear =
        useCallback(async () => {
            if (
                loading ||
                completed === 0
            ) {
                return;
            }

            try {
                setLoading(true);

                const removed =
                    await onClearCompleted();

                if (
                    removed.length === 0
                ) {
                    return;
                }

                toast.success(
                    `${removed.length}件削除しました`
                );

                if (onRestore) {
                    toast.action(
                        "元に戻す",
                        "戻す",
                        () => {
                            onRestore(
                                removed
                            );
                        }
                    );
                }
            } catch {
                toast.error(
                    "削除できませんでした"
                );
            } finally {
                setLoading(false);
            }
        }, [
            completed,
            loading,
            onClearCompleted,
            onRestore,
        ]);

    return (
        <footer className="border-t border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
                <span aria-live="polite">
                    {total}件中{" "}
                    {completed}件完了
                    ・残り{" "}
                    {remaining}件
                </span>

                <button
                    type="button"
                    onClick={
                        handleClear
                    }
                    disabled={
                        loading ||
                        completed ===
                        0
                    }
                    className={clsx(
                        "flex items-center gap-1 rounded-md px-3 py-1 transition",
                        "text-red-500 hover:bg-red-50",
                        "dark:hover:bg-red-950/40",
                        "disabled:pointer-events-none disabled:opacity-40"
                    )}
                >
                    {loading && (
                        <Loader2
                            size={14}
                            className="animate-spin"
                        />
                    )}

                    {loading
                        ? "削除中"
                        : "完了を削除"}
                </button>
            </div>

            <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                role="progressbar"
                aria-valuenow={
                    progress
                }
                aria-valuemin={
                    0
                }
                aria-valuemax={
                    100
                }
            >
                <div
                    style={{
                        width: `${progress}%`,
                    }}
                    className={clsx(
                        "h-full transition-all duration-300",
                        progressColor
                    )}
                />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                <span>
                    {statusText}
                </span>

                {showPercentage && (
                    <span>
                        {progress}%
                    </span>
                )}
            </div>
        </footer>
    );
}