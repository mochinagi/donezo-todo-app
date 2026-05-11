"use client";

import {
    useEffect,
    useTransition,
} from "react";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
    error: Error & {
        digest?: string;
    };

    reset: () => void;
};

export default function ErrorPage({
    error,
    reset,
}: ErrorPageProps) {
    const [
        isPending,
        startTransition,
    ] = useTransition();

    useEffect(() => {
        console.error(error);
    }, [error]);

    const isDevelopment =
        process.env.NODE_ENV ===
        "development";

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <AlertCircle
                            size={20}
                        />
                    </div>

                    <div>
                        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            Something went wrong
                        </h1>

                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            The page could not be loaded.
                        </p>
                    </div>
                </div>

                {isDevelopment &&
                    error.message && (
                        <div className="mt-6 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {
                                error.message
                            }
                        </div>
                    )}

                <div className="mt-6 flex items-center gap-3">
                    <Button
                        loading={
                            isPending
                        }
                        onClick={() => {
                            startTransition(
                                () => {
                                    reset();
                                }
                            );
                        }}
                    >
                        Try again
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            window.location.href =
                                "/";
                        }}
                    >
                        Back to home
                    </Button>
                </div>
            </div>
        </div>
    );
}