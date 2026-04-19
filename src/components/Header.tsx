"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import {
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";

/* ----------------------------- */
const categoryMap = {
    myday: "マイデイ",
    important: "重要",
    planned: "予定あり",
    tasks: "すべてのタスク",
} as const;

type CategoryId = keyof typeof categoryMap;

/* ----------------------------- */
function useDebouncedCallback<T extends (...args: unknown[]) => void>(
    callback: T,
    delay: number
) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debounced = useCallback(
        (...args: Parameters<T>) => {
            if (timerRef.current) clearTimeout(timerRef.current);

            timerRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    );

    const cancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => cancel();
    }, [cancel]);

    return { debounced, cancel };
}

/* ----------------------------- */

export default function Header({
    categoryId,
    search,
    onSearchChange,
    total = 0,
}: {
    categoryId: CategoryId;
    search: string;
    onSearchChange: (value: string) => void;
    total?: number;
}) {
    /* ----------------------------- */
    const categoryName = categoryMap[categoryId] ?? "タスク";

    /* ----------------------------- */
    const [localValue, setLocalValue] = useState(search);
    const syncingRef = useRef(false);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const isComposingRef = useRef(false);

    /* ----------------------------- */
    const { debounced, cancel } = useDebouncedCallback(
        (value: string) => {
            syncingRef.current = true;
            onSearchChange(value);
        },
        300
    );

    useEffect(() => {
        if (isComposingRef.current) return;
        debounced(localValue);
    }, [localValue, debounced]);

    useEffect(() => {
        if (syncingRef.current) {
            syncingRef.current = false;
            return;
        }
        setLocalValue(search);
    }, [search]);

    /* ----------------------------- */
    const toggleFocus = useCallback(() => {
        const input = inputRef.current;
        if (!input) return;

        if (document.activeElement === input) {
            input.blur();
        } else {
            input.focus();
            input.select();
        }
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isTyping =
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement;

            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                toggleFocus();
            }

            if (e.key === "/" && !isTyping) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [toggleFocus]);

    /* ----------------------------- */
    const subtitle = (() => {
        if (total === 0) {
            return search
                ? "条件に一致するタスクはありません"
                : "タスクがありません";
        }

        if (search) {
            return `「${search}」の検索結果（${total}件）`;
        }

        return `${total}件のタスク`;
    })();

    /* ----------------------------- */
    const handleClear = useCallback(() => {
        cancel();
        setLocalValue("");
        onSearchChange("");
        inputRef.current?.focus();
    }, [onSearchChange, cancel]);

    /* ----------------------------- */
    return (
        <header
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between
            bg-white/80 dark:bg-gray-900/80 backdrop-blur
            px-6 py-4 border-b border-gray-200 dark:border-gray-700"
        >
            {/* 标题 */}
            <div className="flex flex-col mb-3 sm:mb-0">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {categoryName}
                </h2>

                <p
                    className="text-sm text-gray-400"
                    aria-live="polite"
                >
                    {subtitle}
                </p>
            </div>

            {/* 搜索 */}
            <div
                role="search"
                className="relative w-full max-w-xs sm:w-72"
            >
                <Input
                    ref={inputRef}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onCompositionStart={() => {
                        isComposingRef.current = true;
                    }}
                    onCompositionEnd={(e) => {
                        isComposingRef.current = false;
                        setLocalValue(e.currentTarget.value);
                    }}
                    placeholder="タスクを検索... (⌘K / /)"
                    className={clsx(
                        "pl-10 pr-10 rounded-lg transition-all",
                        "focus:ring-2 focus:ring-blue-400 focus:outline-none",
                        "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    role="searchbox"
                    aria-label="タスク検索"
                    aria-keyshortcuts="Ctrl+K Meta+K /"
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            handleClear();
                            inputRef.current?.blur();
                        }
                    }}
                />

                <Search
                    aria-hidden="true"
                    className={clsx(
                        "absolute left-3 top-1/2 -translate-y-1/2 transition",
                        localValue ? "text-gray-600" : "text-gray-400"
                    )}
                    size={16}
                />

                {localValue && (
                    <button
                        onClick={handleClear}
                        aria-label="検索をクリア"
                        className="absolute right-3 top-1/2 -translate-y-1/2
                        text-gray-400 hover:text-gray-600 transition
                        p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
                        focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </header>
    );
}