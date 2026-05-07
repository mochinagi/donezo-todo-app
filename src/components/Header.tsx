"use client";

import { Input } from "@/components/ui/input";

import {
    Search,
    X,
} from "lucide-react";

import clsx from "clsx";

import {
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";

const categoryMap = {
    myday: "マイデイ",
    important: "重要",
    planned: "予定あり",
    tasks: "すべてのタスク",
} as const;

type CategoryId =
    keyof typeof categoryMap;

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
    const categoryName =
        categoryMap[categoryId] ??
        "タスク";

    const [value, setValue] =
        useState(search);

    const inputRef =
        useRef<HTMLInputElement>(null);

    const composingRef =
        useRef(false);

    const debounceRef = useRef<
        ReturnType<typeof setTimeout> | undefined
    >(undefined);

    useEffect(() => {
        if (composingRef.current) {
            return;
        }

        setValue(search);
    }, [search]);

    useEffect(() => {
        if (composingRef.current) {
            return;
        }

        if (debounceRef.current) {
            clearTimeout(
                debounceRef.current
            );
        }

        debounceRef.current =
            setTimeout(() => {
                onSearchChange(value);
            }, 250);

        return () => {
            if (
                debounceRef.current
            ) {
                clearTimeout(
                    debounceRef.current
                );
            }
        };
    }, [value, onSearchChange]);

    const focusSearch =
        useCallback(() => {
            const element =
                inputRef.current;

            if (!element) {
                return;
            }

            if (
                document.activeElement ===
                element
            ) {
                element.blur();

                return;
            }

            element.focus();
            element.select();
        }, []);

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            const target =
                document.activeElement;

            const isTyping =
                target instanceof
                HTMLInputElement ||
                target instanceof
                HTMLTextAreaElement;

            if (
                (event.metaKey ||
                    event.ctrlKey) &&
                event.key.toLowerCase() ===
                "k"
            ) {
                event.preventDefault();

                focusSearch();
            }

            if (
                event.key === "/" &&
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
    }, [focusSearch]);

    const clearSearch =
        useCallback(() => {
            setValue("");

            onSearchChange("");

            inputRef.current?.focus();
        }, [onSearchChange]);

    let subtitle = `${total}件のタスク`;

    if (total === 0) {
        subtitle = search
            ? "検索結果がありません"
            : "タスクがありません";
    }

    if (search && total > 0) {
        subtitle = `"${search}" の検索結果 · ${total}件`;
    }

    return (
        <header
            className={clsx(
                "flex flex-col justify-between gap-4 border-b px-6 py-4",
                "bg-background/80 backdrop-blur",
                "sm:flex-row sm:items-center"
            )}
        >
            <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold tracking-tight">
                    {categoryName}
                </h1>

                <p
                    aria-live="polite"
                    className="mt-1 text-sm text-muted-foreground"
                >
                    {subtitle}
                </p>
            </div>

            <div className="relative w-full sm:w-72">
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) =>
                        setValue(
                            e.target.value
                        )
                    }
                    onCompositionStart={() => {
                        composingRef.current =
                            true;
                    }}
                    onCompositionEnd={(
                        e
                    ) => {
                        composingRef.current =
                            false;

                        setValue(
                            e.currentTarget
                                .value
                        );
                    }}
                    onKeyDown={(e) => {
                        if (
                            e.key ===
                            "Escape"
                        ) {
                            if (value) {
                                clearSearch();
                            } else {
                                inputRef.current?.blur();
                            }
                        }
                    }}
                    placeholder="検索"
                    autoComplete="off"
                    role="searchbox"
                    aria-label="タスク検索"
                    className="pl-9 pr-9"
                />

                <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />

                {value ? (
                    <button
                        onClick={
                            clearSearch
                        }
                        aria-label="検索をクリア"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:opacity-70"
                    >
                        <X size={16} />
                    </button>
                ) : null}
            </div>
        </header>
    );
}