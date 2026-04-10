"use client";

import { memo, useMemo, useCallback } from "react";
import { CheckCircle2, Star, Calendar, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";

/* -----------------------------
   Category 定義
----------------------------- */
interface Category {
    id: string;
    name: string;
    icon: LucideIcon;
}

const categories: Category[] = [
    { id: "tasks", name: "すべてのタスク", icon: List },
    { id: "active", name: "未完了", icon: CheckCircle2 },
    { id: "completed", name: "完了済み", icon: CheckCircle2 },
];

/* -----------------------------
   Sidebar Item
----------------------------- */
interface SidebarItemProps {
    category: Category;
    active: boolean;
    count?: number;
    onClick: (id: string) => void;
}

const SidebarItem = memo(function SidebarItem({
    category,
    active,
    count,
    onClick,
}: SidebarItemProps) {
    const { name, icon: Icon, id } = category;

    const handleClick = useCallback(() => {
        onClick(id);
    }, [id, onClick]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLButtonElement>) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(id);
            }
        },
        [id, onClick]
    );

    return (
        <button
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="tab"
            aria-selected={active}
            className={`group relative flex items-center justify-between w-full px-4 py-2 rounded-md text-left
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
                ${active
                    ? "bg-blue-500 text-white font-semibold shadow"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
        >
            {/* active indicator */}
            {active && (
                <span className="absolute left-0 top-0 h-full w-1 bg-blue-700 rounded-r-md" />
            )}

            <div className="flex items-center gap-3">
                <Icon
                    size={18}
                    className={`transition-transform duration-200 ${!active && "group-hover:scale-110"
                        }`}
                />
                <span>{name}</span>
            </div>

            {count !== undefined && (
                <span
                    className={`text-xs px-2 py-0.5 rounded-full transition
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

/* -----------------------------
   Sidebar
----------------------------- */
export default function Sidebar() {
    const { activeCategory, setCategory, todos } = useTodoStore();

    /* -----------------------------
       counts（单次循环优化）
    ----------------------------- */
    const counts = useMemo(() => {
        let total = 0;
        let completed = 0;

        for (const t of todos) {
            total++;
            if (t.completed) completed++;
        }

        return {
            tasks: total,
            active: total - completed,
            completed: completed,
        };
    }, [todos]);

    /* -----------------------------
       stable handler
    ----------------------------- */
    const handleSelect = useCallback(
        (id: string) => {
            setCategory(id);
        },
        [setCategory]
    );

    return (
        <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Logo */}
            <div className="p-6 text-2xl font-extrabold tracking-tight border-b border-gray-200 dark:border-gray-700">
                <span className="text-blue-500">Done</span>zo
            </div>

            {/* Navigation */}
            <nav role="tablist" className="flex-1 p-4 space-y-2">
                {categories.map((cat) => (
                    <SidebarItem
                        key={cat.id}
                        category={cat}
                        active={activeCategory === cat.id}
                        count={counts[cat.id as keyof typeof counts]}
                        onClick={handleSelect}
                    />
                ))}
            </nav>
        </aside>
    );
}