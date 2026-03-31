"use client";

import { memo, useMemo } from "react";
import { CheckCircle2, Star, Calendar, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";

/**
 * カテゴリ型
 */
type Category = {
    id: string;
    name: string;
    icon: LucideIcon;
};

/**
 * カテゴリ一覧（Headerと将来共通化OK）
 */
const categories: Category[] = [
    { id: "myday", name: "マイデイ", icon: CheckCircle2 },
    { id: "important", name: "重要", icon: Star },
    { id: "planned", name: "予定あり", icon: Calendar },
    { id: "tasks", name: "すべてのタスク", icon: List },
];

/**
 * SidebarItem
 */
const SidebarItem = memo(function SidebarItem({
    category,
    active,
    count,
    onClick
}: {
    category: Category;
    active: boolean;
    count?: number;
    onClick: () => void;
}) {
    const { name, icon: Icon } = category;

    return (
        <button
            onClick={onClick}
            role="tab"
            aria-selected={active}
            className={`group relative flex items-center justify-between w-full px-4 py-2 rounded-md text-left
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
            ${active
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
        >
            {/* 左バー */}
            {active && (
                <span className="absolute left-0 top-0 h-full w-1 bg-blue-700 rounded-r-md" />
            )}

            <div className="flex items-center gap-3">
                <Icon
                    size={18}
                    className={`transition-transform duration-200 
                    ${!active && "group-hover:scale-110"}`}
                />
                <span>{name}</span>
            </div>

            {/* count */}
            {count !== undefined && (
                <span
                    className={`text-xs px-2 py-0.5 rounded-full
                    ${active
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
});

/**
 * Sidebar（Zustand統合版）
 */
export default function Sidebar() {
    const { activeCategory, setCategory, todos } = useTodoStore();

    /**
     * カウント計算
     */
    const counts = useMemo(() => {
        return {
            tasks: todos.length,
            myday: todos.length, // 仮（将来拡張）
            important: todos.length,
            planned: todos.length,
        };
    }, [todos]);

    return (
        <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">

            {/* Logo */}
            <div className="p-6 text-2xl font-extrabold tracking-tight border-b border-gray-200 dark:border-gray-700">
                <span className="text-blue-500">Done</span>zo
            </div>

            {/* Navigation */}
            <nav
                role="tablist"
                className="flex-1 p-4 space-y-2"
            >
                {categories.map((cat) => (
                    <SidebarItem
                        key={cat.id}
                        category={cat}
                        active={activeCategory === cat.id}
                        count={counts[cat.id as keyof typeof counts]}
                        onClick={() => setCategory(cat.id)}
                    />
                ))}
            </nav>
        </aside>
    );
}