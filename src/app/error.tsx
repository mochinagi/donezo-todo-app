"use client";

import {
    useEffect,
    useRef,
    useTransition,
    useMemo,
} from "react";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
    error: Error & {
        digest?: string;
    };

    reset: () => void;
};

function getErrorId(message: string) {
    let hash = 0;

    for (let i = 0; i < message.length; i++) {
        hash =
            (hash * 31 +
                message.charCodeAt(i)) |
            0;
    }

    return Math.abs(hash)
        .toString(16)
        .slice(0, 6);
}

export default function ErrorPage({
    error,
    reset,
}: ErrorPageProps) {
    const [
        isPending,
        startTransition,
    ] = useTransition();

    const hasRetried =
        useRef(false);

    useEffect(() => {
        console.error("[App Error]", error);
    }, [error]);

    const isDevelopment =
        process.env.NODE_ENV ===
        "development";

    const errorId = useMemo(() => {
        return getErrorId(
            error.message || "unknown"
        );
    }, [error.message]);

    const handleRetry = () => {
        if (isPending) return;
        if (hasRetried.current) return;

        hasRetried.current = true;

        startTransition(() => {
            reset();
        });

        setTimeout(() => {
            hasRetried.current = false;
        }, 1500);
    };

    const goHome = () => {
        window.location.href = "/";
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <AlertCircle size={20} />
                    </div>

                    <div>
                        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            Something went wrong
                        </h1>

                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            We couldn’t complete the request.
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                            Error ID: {errorId}
                        </p>
                    </div>
                </div>

                {isDevelopment && (
                    <div className="mt-6 space-y-2 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        <div className="font-medium">
                            Debug Info
                        </div>

                        <div>
                            {error.name}
                        </div>

                        <div>
                            {error.message}
                        </div>

                        {error.stack && (
                            <pre className="whitespace-pre-wrap break-words text-[10px] opacity-80">
                                {error.stack}
                            </pre>
                        )}
                    </div>
                )}

                <div className="mt-6 flex items-center gap-3">
                    <Button
                        loading={isPending}
                        onClick={handleRetry}
                    >
                        Try again
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={goHome}
                    >
                        Back to home
                    </Button>
                </div>
            </div>
        </div>
    );
}