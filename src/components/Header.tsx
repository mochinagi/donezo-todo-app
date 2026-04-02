"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import clsx from "clsx";

/**
 * カテゴリ名マッピング（将来可共享）
 */
const categoryMap: Record<string, string> = {
    myday: "マイデイ",
    important: "重要",
    planned: "予定あり",
    tasks: "すべてのタスク",
};

/**
 * Header
 */
export default function Header({
    categoryId,
    search,
    onSearchChange
}: {
    categoryId: string;
    search: string;
    onSearchChange: (value: string) => void;
}) {
    const categoryName = categoryMap[categoryId] ?? "タスク";

    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white px-6 py-4 border-b border-gray-200">
            {/* タイトルエリア */}
            <div className="flex flex-col mb-3 sm:mb-0">
                <h2 className="text-3xl font-bold text-gray-900">{categoryName}</h2>
                <p className="text-sm text-gray-400">
                    タスクを整理して効率よく進めましょう
                </p>
            </div>

            {/* 検索ボックス */}
            <div role="search" className="relative w-full max-w-xs sm:w-72">
                <Input
                    placeholder="タスクを検索..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={clsx(
                        "pl-10 pr-10 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-shadow rounded-md"
                    )}
                    aria-label="タスク検索"
                    autoComplete="off"
                />

                {/* 検索アイコン */}
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                />

                {/* クリアボタン */}
                {search && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 rounded-full"
                        aria-label="検索をクリア"
                        tabIndex={0}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </header>
    );
}