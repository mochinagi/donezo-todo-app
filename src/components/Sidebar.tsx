"use client";

import { memo, useMemo, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";

/* ----------------------------- */
/* 类型（🔥统一 store 类型） */
type CategoryId = "tasks" | "active" | "completed";

interface Category {
    id: CategoryId;
    name: string;
    icon: LucideIcon;
}

/* ----------------------------- */
/* 配置（🔥可扩展） */
const categories: Category[] = [
    { id: "tasks", name: "すべてのタスク", icon: List },
    { id: "active", name: "未完了", icon: CheckCircle2 },
    { id: "completed", name: "完了済み", icon: CheckCircle2 },
];

/* ----------------------------- */
/* Sidebar Item */
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
            tabIndex={active ? 0 : -1}
            className={`group relative flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-left
                transition-all duration-200
                ${active
                    ? "bg-blue-500 text-white shadow-md scale-[1.02]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
        >
            {/* 激活条 */}
            <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r
                transition-all duration-200
                ${active ? "bg-blue-700 opacity-100" : "opacity-0 group-hover:opacity-50 bg-gray-400"}`}
            />

            <div className="flex items-center gap-3">
                <Icon
                    size={18}
                    className={`transition-transform duration-200
                        ${!active && "group-hover:scale-110"}`}
                />
                <span className="text-sm">{name}</span>
            </div>

            <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition
                    ${active
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}
                    ${count === 0 && "opacity-40"}
                `}
            >
                {count}
            </span>
        </button>
    );
});

/* ----------------------------- */
/* Sidebar */
export default function Sidebar() {
    const todos = useTodoStore((s) => s.todos);
    const activeCategory = useTodoStore((s) => s.activeCategory);
    const setActiveCategory = useTodoStore((s) => s.setActiveCategory);

    const itemRefs = useRef<HTMLButtonElement[]>([]);

    /* ---------------- counts ---------------- */
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

    /* ---------------- click ---------------- */
    const handleSelect = useCallback(
        (id: CategoryId) => {
            setActiveCategory(id);
        },
        [setActiveCategory]
    );

    /* ---------------- keyboard nav（🔥加分点） ---------------- */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!["ArrowUp", "ArrowDown"].includes(e.key)) return;

            const index = categories.findIndex(
                (c) => c.id === activeCategory
            );

            let nextIndex = index;

            if (e.key === "ArrowDown") {
                nextIndex = (index + 1) % categories.length;
            }

            if (e.key === "ArrowUp") {
                nextIndex =
                    (index - 1 + categories.length) % categories.length;
            }

            const next = categories[nextIndex];
            setActiveCategory(next.id);

            itemRefs.current[nextIndex]?.focus();
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [activeCategory, setActiveCategory]);

    return (
        <aside className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Logo */}
            <div className="p-6 text-2xl font-extrabold tracking-tight border-b border-gray-200 dark:border-gray-700">
                <span className="text-blue-500">Done</span>zo
            </div>

            {/* Navigation */}
            <nav role="tablist" className="flex-1 p-4 space-y-2">
                {categories.map((cat, index) => (
                    <div key={cat.id} ref={(el) => {
                        if (el) itemRefs.current[index] = el.querySelector("button")!;
                    }}>
                        <SidebarItem
                            category={cat}
                            active={activeCategory === cat.id}
                            count={counts[cat.id]}
                            onClick={handleSelect}
                        />
                    </div>
                ))}
            </nav>
        </aside>
    );
}