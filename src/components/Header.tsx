"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";

/* ================= TYPES ================= */

const categoryMap = {
    myday: "マイデイ",
    important: "重要",
    planned: "予定あり",
    tasks: "すべてのタスク",
} as const;

type CategoryId = keyof typeof categoryMap;

type HeaderProps = {
    categoryId: CategoryId;
    search: string;
    onSearchChange: (value: string) => void;
    total?: number;
};

/* ================= HOOK ================= */

function useDebounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback(
        (...args: Parameters<T>) => {
            if (timer.current) clearTimeout(timer.current);

            timer.current = setTimeout(() => {
                fn(...args);
            }, delay);
        },
        [fn, delay]
    );
}

/* ================= COMPONENT ================= */

export default function Header({
    categoryId,
    search,
    onSearchChange,
    total = 0,
}: HeaderProps) {
    const categoryName = categoryMap[categoryId] ?? "タスク";

    const [value, setValue] = useState(search);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const isComposing = useRef(false);

    const debouncedSearch = useDebounce(onSearchChange, 300);

    /* sync external -> local */
    useEffect(() => {
        if (isComposing.current) return;
        setValue(search);
    }, [search]);

    /* local -> store */
    useEffect(() => {
        if (isComposing.current) return;
        debouncedSearch(value);
    }, [value, debouncedSearch]);

    /* keyboard focus */
    const focusInput = useCallback(() => {
        const el = inputRef.current;
        if (!el) return;

        if (document.activeElement === el) {
            el.blur();
        } else {
            el.focus();
            el.select();
        }
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isTyping =
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement;

            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                focusInput();
            }

            if (e.key === "/" && !isTyping) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [focusInput]);

    /* subtitle */
    const subtitle = useMemo(() => {
        if (total === 0 && !search) return "タスクがありません";
        if (total === 0 && search) return "該当するタスクがありません";

        if (search) {
            return `"${search}" の検索結果 · ${total}件`;
        }

        return `${total}件のタスク`;
    }, [search, total]);

    /* clear */
    const clear = useCallback(() => {
        setValue("");
        onSearchChange("");
        inputRef.current?.focus();
    }, [onSearchChange]);

    /* ================= UI ================= */

    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between
            bg-white/80 dark:bg-gray-900/80 backdrop-blur
            px-6 py-4 border-b border-gray-200 dark:border-gray-700">

            {/* left */}
            <div className="flex flex-col mb-3 sm:mb-0">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {categoryName}
                </h2>

                <p className="text-sm text-gray-400" aria-live="polite">
                    {subtitle}
                </p>
            </div>

            {/* search */}
            <div className="relative w-full max-w-xs sm:w-72 group">

                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onCompositionStart={() => {
                        isComposing.current = true;
                    }}
                    onCompositionEnd={(e) => {
                        isComposing.current = false;
                        setValue(e.currentTarget.value);
                    }}
                    placeholder="検索（Ctrl+K / /）"
                    className={clsx(
                        "pl-10 pr-10 rounded-lg transition-all",
                        "focus:ring-2 focus:ring-blue-400 focus:outline-none",
                        "group-focus-within:ring-2 group-focus-within:ring-blue-400"
                    )}
                    role="searchbox"
                    aria-label="タスク検索"
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            value ? clear() : inputRef.current?.blur();
                        }
                    }}
                />

                <Search
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                />

                {value && (
                    <button
                        onClick={clear}
                        aria-label="検索をクリア"
                        className="absolute right-3 top-1/2 -translate-y-1/2
                        text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={16} />
                    </button>
                )}

                {/* keyboard hint */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hidden sm:block">
                    ⌘K
                </div>
            </div>
        </header>
    );
}