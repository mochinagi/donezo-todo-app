"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect, useMemo, useRef } from "react";

/* -----------------------------
   カテゴリ名
----------------------------- */
const categoryMap: Record<string, string> = {
    myday: "マイデイ",
    important: "重要",
    planned: "予定あり",
    tasks: "すべてのタスク",
};

export default function Header({
    categoryId,
    search,
    onSearchChange,
    total = 0, // 🔥 可选扩展
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
        () => categoryMap[categoryId] ?? "タスク",
        [categoryId]
    );

    /* -----------------------------
       本地输入 + debounce
    ----------------------------- */
    const [localValue, setLocalValue] = useState(search);
    const [isComposing, setIsComposing] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isComposing) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            onSearchChange(localValue);
        }, 300);
    }, [localValue, isComposing, onSearchChange]);

    /* -----------------------------
       同步外部
    ----------------------------- */
    useEffect(() => {
        setLocalValue(search);
    }, [search]);

    /* -----------------------------
       subtitle（更产品）
    ----------------------------- */
    const subtitle = useMemo(() => {
        if (total === 0) return "タスクがありません";
        if (search) return `「${search}」の検索結果`;
        return `${total}件のタスク`;
    }, [total, search]);

    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white px-6 py-4 border-b border-gray-200">
            {/* 标题 */}
            <div className="flex flex-col mb-3 sm:mb-0">
                <h2 className="text-3xl font-bold text-gray-900">
                    {categoryName}
                </h2>
                <p className="text-sm text-gray-400">{subtitle}</p>
            </div>

            {/* 搜索 */}
            <div role="search" className="relative w-full max-w-xs sm:w-72">
                <Input
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={(e) => {
                        setIsComposing(false);
                        setLocalValue(e.currentTarget.value);
                    }}
                    placeholder="タスクを検索..."
                    className={clsx(
                        "pl-10 pr-10 focus:ring-2 focus:ring-blue-400 transition rounded-md"
                    )}
                    aria-label="タスク検索"
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            setLocalValue("");
                            onSearchChange("");
                        }
                    }}
                />

                {/* icon */}
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                />

                {/* 清除 */}
                {localValue && (
                    <button
                        onClick={() => {
                            setLocalValue("");
                            onSearchChange("");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
                        aria-label="検索をクリア"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </header>
    );
}