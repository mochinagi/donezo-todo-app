"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
} from "react";

/* -----------------------------
   カテゴリ名
----------------------------- */
const categoryMap = {
    myday: "マイデイ",
    important: "重要",
    planned: "予定あり",
    tasks: "すべてのタスク",
} as const;

/* -----------------------------
   Header
----------------------------- */
export default function Header({
    categoryId,
    search,
    onSearchChange,
    total = 0,
}: {
    categoryId: string;
    search: string;
    onSearchChange: (value: string) => void;
    total?: number;
}) {
    /* -----------------------------
       category 名
    ----------------------------- */
    const categoryName = useMemo(
        () =>
            categoryMap[
            categoryId as keyof typeof categoryMap
            ] ?? "タスク",
        [categoryId]
    );

    /* -----------------------------
       输入状态
    ----------------------------- */
    const [localValue, setLocalValue] = useState(search);
    const [isComposing, setIsComposing] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    /* -----------------------------
       debounce
    ----------------------------- */
    useEffect(() => {
        if (isComposing) return;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            onSearchChange(localValue);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [localValue, isComposing, onSearchChange]);

    /* -----------------------------
       同步外部
    ----------------------------- */
    useEffect(() => {
        setLocalValue(search);
    }, [search]);

    /* -----------------------------
       ⌘K / Ctrl+K
    ----------------------------- */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select(); // 🔥 全选
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    /* -----------------------------
       subtitle
    ----------------------------- */
    const subtitle = useMemo(() => {
        if (search && total === 0) {
            return "該当するタスクがありません";
        }
        if (total === 0) {
            return "タスクがありません";
        }
        if (search) {
            return `「${search}」の検索結果 (${total})`;
        }
        return `${total}件のタスク`;
    }, [total, search]);

    /* -----------------------------
       clear
    ----------------------------- */
    const handleClear = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setLocalValue("");
        onSearchChange("");
        inputRef.current?.focus();
    }, [onSearchChange]);

    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white px-6 py-4 border-b border-gray-200">
            {/* 标题 */}
            <div className="flex flex-col mb-3 sm:mb-0">
                <h2 className="text-3xl font-bold text-gray-900">
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
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={(e) => {
                        setIsComposing(false);
                        setLocalValue(e.currentTarget.value);
                    }}
                    placeholder="タスクを検索... (⌘K)"
                    className={clsx(
                        "pl-10 pr-10 rounded-md transition",
                        "focus:ring-2 focus:ring-blue-400 focus:outline-none",
                        localValue && "text-gray-900"
                    )}
                    role="searchbox"
                    aria-label="タスク検索"
                    aria-controls="todo-list"
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            handleClear();
                        }
                    }}
                />

                <Search
                    className={clsx(
                        "absolute left-3 top-1/2 -translate-y-1/2",
                        localValue ? "text-gray-600" : "text-gray-400"
                    )}
                    size={16}
                />

                {localValue && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                        text-gray-400 hover:text-gray-600 transition
                        p-1 rounded-full hover:bg-gray-100
                        focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-label="検索をクリア"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </header>
    );
}