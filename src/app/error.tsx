"use client";

import {
    useEffect,
    useState,
    useTransition,
} from "react";

import { useRouter } from "next/navigation";

import {
    AlertCircle,
    Copy,
    Home,
    RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
    error: Error & {
        digest?: string;
    };

    reset: () => void;
};

function createErrorId(
    input: string
) {
    let hash = 0;

    for (let i = 0; i < input.length; i++) {
        hash =
            (hash * 31 +
                input.charCodeAt(i)) |
            0;
    }

    return Math.abs(hash)
        .toString(16)
        .slice(0, 8);
}

export default function ErrorPage({
    error,
    reset,
}: ErrorPageProps) {
    const router = useRouter();

    const [isPending, startTransition] =
        useTransition();

    const [copied, setCopied] =
        useState<
            "id" | "details" | null
        >(null);

    const isDevelopment =
        process.env.NODE_ENV ===
        "development";

    const errorId = createErrorId(
        [
            error.name,
            error.message,
            error.digest,
        ]
            .filter(Boolean)
            .join(":")
    );

    useEffect(() => {
        if (isDevelopment) {
            console.error(error);
        }
    }, [error, isDevelopment]);

    const handleRetry = () => {
        if (isPending) {
            return;
        }

        startTransition(() => {
            reset();
        });
    };

    const handleCopy = async (
        value: string,
        type: "id" | "details"
    ) => {
        try {
            await navigator.clipboard.writeText(
                value
            );

            setCopied(type);

            window.setTimeout(() => {
                setCopied(null);
            }, 1500);
        } catch {
            setCopied(null);
        }
    };

    const handleCopyId = () =>
        handleCopy(errorId, "id");

    const handleCopyDetails = () =>
        handleCopy(
            JSON.stringify(
                {
                    errorId,
                    name: error.name,
                    message:
                        error.message,
                    digest:
                        error.digest,
                    stack: error.stack,
                },
                null,
                2
            ),
            "details"
        );

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-6 py-10">
            <section className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <AlertCircle
                            size={20}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                            Failed to load page
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                            The request could
                            not be completed.
                            Try again or return
                            to the main page.
                        </p>

                        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                            <span>
                                Error ID:
                                {" "}
                                {errorId}
                            </span>

                            <button
                                type="button"
                                onClick={
                                    handleCopyId
                                }
                                className="transition hover:text-zinc-700 dark:hover:text-zinc-200"
                            >
                                <Copy
                                    size={
                                        12
                                    }
                                />
                            </button>

                            {copied ===
                                "id" && (
                                    <span>
                                        copied
                                    </span>
                                )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button
                        onClick={
                            handleRetry
                        }
                        disabled={
                            isPending
                        }
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />

                        {isPending
                            ? "Retrying"
                            : "Try again"}
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            router.push(
                                "/"
                            )
                        }
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Back to home
                    </Button>
                </div>

                {isDevelopment && (
                    <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                            <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    Debug
                                    information
                                </p>

                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    Visible in
                                    development
                                    mode only
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleCopyDetails
                                }
                                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
                            >
                                <Copy
                                    size={
                                        12
                                    }
                                />

                                {copied ===
                                    "details"
                                    ? "Copied"
                                    : "Copy"}
                            </button>
                        </div>

                        <div className="space-y-3 p-4 text-xs text-zinc-600 dark:text-zinc-300">
                            <div>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    Name:
                                </span>
                                {" "}
                                {error.name}
                            </div>

                            <div>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    Message:
                                </span>
                                {" "}
                                {error.message}
                            </div>

                            {error.digest && (
                                <div>
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                        Digest:
                                    </span>
                                    {" "}
                                    {
                                        error.digest
                                    }
                                </div>
                            )}

                            {error.stack && (
                                <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-zinc-100 p-3 text-[11px] leading-5 dark:bg-zinc-950">
                                    {
                                        error.stack
                                    }
                                </pre>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}