"use client";

import { memo, useMemo, useCallback } from "react";
import { CheckCircle2, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";

/* -----------------------------
   类型
----------------------------- */
type CategoryId = "tasks" | "active" | "completed";

interface Category {
    id: CategoryId;
    name: string;
    icon: LucideIcon;
}

const categories = [
    { id: "tasks", name: "すべてのタスク", icon: List },
    { id: "active", name: "未完了", icon: CheckCircle2 },
    { id: "completed", name: "完了済み", icon: CheckCircle2 },
] as const;

/* -----------------------------
   Sidebar Item
----------------------------- */
interface SidebarItemProps {
    category: Category;
    active: boolean;
    count: number;
    onClick: (id: CategoryId) => void;
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

    return (
        <button
            onClick={handleClick}
            role="tab"
            aria-selected={active}
            className={`group relative flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-left
                transition-all duration-200
                ${active
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
        >
            {/* 左侧激活条 */}
            <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r
                transition-all duration-200
                ${active ? "bg-blue-700 opacity-100" : "opacity-0 group-hover:opacity-50 bg-gray-400"}
                `}
            />

            {/* 左侧内容 */}
            <div className="flex items-center gap-3">
                <Icon
                    size={18}
                    className={`transition-transform duration-200
                        ${!active && "group-hover:scale-110"}
                    `}
                />
                <span className="text-sm">{name}</span>
            </div>

            {/* count */}
            <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition
                    ${active
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
            >
                {count}
            </span>
        </button>
    );
});

/* -----------------------------
   Sidebar
----------------------------- */
export default function Sidebar() {
    const { activeCategory, setActiveCategory, todos } = useTodoStore();

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
            completed,
        };
    }, [todos]);

    /* -----------------------------
       handler
    ----------------------------- */
    const handleSelect = useCallback(
        (id: CategoryId) => {
            setActiveCategory(id);
        },
        [setActiveCategory]
    );

    return (
        <aside className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-r border-gray-200 dark:border-gray-700 flex flex-col">
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
                        count={counts[cat.id]}
                        onClick={handleSelect}
                    />
                ))}
            </nav>
        </aside>
    );
}