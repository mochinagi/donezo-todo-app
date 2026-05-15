"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import clsx from "clsx";

import {
    Search,
    X,
} from "lucide-react";

import { Input } from "@/components/ui/input";

const CATEGORY_LABELS = {
    myday: "マイデイ",
    important: "重要",
    planned: "予定あり",
    tasks: "すべてのタスク",
} as const;

const SEARCH_HISTORY_KEY =
    "donezo-search-history";

const SEARCH_DELAY = 200;

type CategoryId =
    keyof typeof CATEGORY_LABELS;

type HeaderProps = {
    categoryId: CategoryId;

    search: string;

    onSearchChange: (
        value: string
    ) => void;

    total?: number;
};

export default function Header({
    categoryId,
    search,
    onSearchChange,
    total = 0,
}: HeaderProps) {
    const [value, setValue] =
        useState(search);

    const inputRef =
        useRef<HTMLInputElement>(null);

    const composing =
        useRef(false);

    const timeoutRef =
        useRef<
            ReturnType<
                typeof setTimeout
            >
        >(null);

    const categoryName =
        CATEGORY_LABELS[
        categoryId
        ] ?? "タスク";

    useEffect(() => {
        if (
            composing.current
        ) {
            return;
        }

        setValue(search);
    }, [search]);

    const commitSearch =
        useCallback(
            (
                nextValue: string
            ) => {
                onSearchChange(
                    nextValue
                );

                if (
                    nextValue.trim()
                ) {
                    localStorage.setItem(
                        SEARCH_HISTORY_KEY,
                        nextValue
                    );

                    return;
                }

                localStorage.removeItem(
                    SEARCH_HISTORY_KEY
                );
            },
            [onSearchChange]
        );

    useEffect(() => {
        if (
            composing.current
        ) {
            return;
        }

        if (
            timeoutRef.current
        ) {
            clearTimeout(
                timeoutRef.current
            );
        }

        timeoutRef.current =
            setTimeout(() => {
                commitSearch(
                    value
                );
            }, SEARCH_DELAY);

        return () => {
            if (
                timeoutRef.current
            ) {
                clearTimeout(
                    timeoutRef.current
                );
            }
        };
    }, [
        value,
        commitSearch,
    ]);

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            const key =
                event.key.toLowerCase();

            const target =
                document.activeElement;

            const isTyping =
                target instanceof
                HTMLInputElement ||
                target instanceof
                HTMLTextAreaElement;

            if (
                (
                    event.metaKey ||
                    event.ctrlKey
                ) &&
                key === "k"
            ) {
                event.preventDefault();

                inputRef.current?.focus();

                inputRef.current?.select();

                if (value) {
                    return;
                }

                const history =
                    localStorage.getItem(
                        SEARCH_HISTORY_KEY
                    );

                if (history) {
                    setValue(
                        history
                    );
                }

                return;
            }

            if (
                key === "/" &&
                !isTyping
            ) {
                event.preventDefault();

                inputRef.current?.focus();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [value]);

    const clearSearch =
        useCallback(() => {
            setValue("");

            onSearchChange("");

            localStorage.removeItem(
                SEARCH_HISTORY_KEY
            );

            inputRef.current?.focus();
        }, [onSearchChange]);

    const subtitle =
        useMemo(() => {
            const hasSearch =
                search.trim()
                    .length > 0;

            if (
                hasSearch
            ) {
                if (
                    total === 0
                ) {
                    return "検索結果がありません";
                }

                return `"${search}" ・ ${total}件`;
            }

            if (
                total === 0
            ) {
                return "タスクがありません";
            }

            return `${total}件のタスク`;
        }, [
            search,
            total,
        ]);

    return (
        <header
            className={clsx(
                "flex flex-col gap-4 border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur",
                "dark:border-zinc-800 dark:bg-zinc-950/80",
                "sm:flex-row sm:items-center sm:justify-between"
            )}
        >
            <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold tracking-tight">
                    {
                        categoryName
                    }
                </h1>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {subtitle}
                </p>
            </div>

            <div className="relative w-full sm:w-80">
                <Input
                    ref={inputRef}
                    value={value}
                    autoComplete="off"
                    placeholder="検索"
                    role="searchbox"
                    aria-label="タスク検索"
                    className="h-10 pl-9 pr-9"
                    onChange={event => {
                        setValue(
                            event.target.value
                        );
                    }}
                    onCompositionStart={() => {
                        composing.current =
                            true;
                    }}
                    onCompositionEnd={event => {
                        composing.current =
                            false;

                        setValue(
                            event.currentTarget.value
                        );
                    }}
                    onKeyDown={event => {
                        if (
                            event.key ===
                            "Escape"
                        ) {
                            if (
                                value
                            ) {
                                clearSearch();

                                return;
                            }

                            inputRef.current?.blur();
                        }

                        if (
                            event.key ===
                            "Enter"
                        ) {
                            inputRef.current?.blur();
                        }
                    }}
                />

                <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                {value && (
                    <button
                        type="button"
                        aria-label="検索をクリア"
                        onClick={
                            clearSearch
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                        <X
                            size={16}
                        />
                    </button>
                )}
            </div>
        </header>
    );
}