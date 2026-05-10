"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import clsx from "clsx";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

const categoryMap = {
    myday: "マイデイ",
    important: "重要",
    planned: "予定あり",
    tasks: "すべてのタスク",
} as const;

const SEARCH_HISTORY_KEY = "donezo-search-history";

type CategoryId = keyof typeof categoryMap;

type HeaderProps = {
    categoryId: CategoryId;
    search: string;
    onSearchChange: (value: string) => void;
    total?: number;
};

function buildSubtitle(search: string, total: number) {
    const hasSearch = Boolean(search.trim());

    if (hasSearch) {
        return total > 0
            ? `"${search}" · ${total}件`
            : "検索結果がありません";
    }

    return total > 0 ? `${total}件のタスク` : "タスクがありません";
}

export default function Header({
    categoryId,
    search,
    onSearchChange,
    total = 0,
}: HeaderProps) {
    const categoryName = categoryMap[categoryId] ?? "タスク";

    const [value, setValue] = useState(search);

    const inputRef = useRef<HTMLInputElement>(null);
    const composingRef = useRef(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const commitSearch = useCallback(
        (next: string) => {
            onSearchChange(next);

            if (next.trim()) {
                localStorage.setItem(SEARCH_HISTORY_KEY, next);
            }
        },
        [onSearchChange]
    );

    useEffect(() => {
        if (!composingRef.current) {
            setValue(search);
        }
    }, [search]);

    useEffect(() => {
        if (composingRef.current) return;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            commitSearch(value);
        }, 200);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [value, commitSearch]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = document.activeElement;

            const isTyping =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement;

            const key = event.key.toLowerCase();

            if ((event.metaKey || event.ctrlKey) && key === "k") {
                event.preventDefault();

                inputRef.current?.focus();
                inputRef.current?.select();

                if (!value) {
                    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
                    if (saved) setValue(saved);
                }

                return;
            }

            if (key === "/" && !isTyping) {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [value]);

    const clearSearch = () => {
        setValue("");
        onSearchChange("");
        inputRef.current?.focus();
    };

    const subtitle = buildSubtitle(search, total);

    return (
        <header
            className={clsx(
                "flex flex-col gap-4 border-b bg-background/80 px-6 py-4 backdrop-blur",
                "sm:flex-row sm:items-center sm:justify-between"
            )}
        >
            <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold tracking-tight">
                    {categoryName}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    {subtitle}
                </p>
            </div>

            <div className="relative w-full sm:w-72">
                <Input
                    ref={inputRef}
                    value={value}
                    autoComplete="off"
                    placeholder="検索"
                    role="searchbox"
                    aria-label="タスク検索"
                    className="pl-9 pr-9"
                    onChange={(e) => setValue(e.target.value)}
                    onCompositionStart={() => {
                        composingRef.current = true;
                    }}
                    onCompositionEnd={(e) => {
                        composingRef.current = false;
                        setValue(e.currentTarget.value);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            if (value) {
                                clearSearch();
                            } else {
                                inputRef.current?.blur();
                            }
                        }

                        if (event.key === "Enter") {
                            inputRef.current?.blur();
                        }
                    }}
                />

                <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />

                {value && (
                    <button
                        onClick={clearSearch}
                        aria-label="検索をクリア"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:opacity-70"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </header>
    );
}