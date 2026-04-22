"use client";

import { memo, useMemo, useCallback, useRef, useEffect } from "react";
import {
    CheckCircle2,
    Circle,
    List,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";
import { shallow } from "zustand/shallow";

/* ================= TYPES ================= */

type CategoryId = "tasks" | "active" | "completed";

interface Category {
    id: CategoryId;
    name: string;
    icon: LucideIcon;
}

/* ================= CONFIG ================= */

const categories = [
    { id: "tasks", name: "すべてのタスク", icon: List },
    { id: "active", name: "未完了", icon: Circle },
    { id: "completed", name: "完了済み", icon: CheckCircle2 },
] as const;

/* ================= ITEM ================= */

interface SidebarItemProps {
    category: Category;
    active: boolean;
    count: number;
    onSelect: (id: CategoryId) => void;
    refCallback: (el: HTMLButtonElement | null) => void;
}

const SidebarItem = memo(function SidebarItem({
    category,
    active,
    count,
    onSelect,
    refCallback,
}: SidebarItemProps) {
    const { name, icon: Icon, id } = category;

    const handleClick = useCallback(() => {
        onSelect(id);
    }, [id, onSelect]);

    return (
        <button
            ref={refCallback}
            type="button"
            onClick={handleClick}
            role="tab"
            id={`tab-${id}`}
            aria-controls={`panel-${id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={`group relative flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-left
                transition-all duration-200 focus:outline-none
                ${active
                    ? "bg-blue-500 text-white shadow-md scale-[1.02]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
        >
            {/* active indicator */}
            <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r
                transition-all duration-200
                ${active
                        ? "bg-blue-700 opacity-100"
                        : "opacity-0 group-hover:opacity-40 bg-gray-400"
                    }`}
            />

            <div className="flex items-center gap-3">
                <Icon size={18} />
                <span className="text-sm">{name}</span>
            </div>

            {/* count */}
            <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium min-w-[24px] text-center
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

/* ================= SIDEBAR ================= */

export default function Sidebar() {
    const { todos, activeCategory, setActiveCategory } = useTodoStore(
        (s) => ({
            todos: s.todos,
            activeCategory: s.activeCategory,
            setActiveCategory: s.setActiveCategory,
        }),
        shallow
    );

    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    /* ===== counts（优化版）===== */
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

    /* ===== select ===== */
    const handleSelect = useCallback(
        (id: CategoryId) => {
            setActiveCategory(id);
        },
        [setActiveCategory]
    );

    /* ===== keyboard nav ===== */
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const index = categories.findIndex(
                (c) => c.id === activeCategory
            );

            let nextIndex = index;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    nextIndex = (index + 1) % categories.length;
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    nextIndex =
                        (index - 1 + categories.length) %
                        categories.length;
                    break;
                case "Home":
                    nextIndex = 0;
                    break;
                case "End":
                    nextIndex = categories.length - 1;
                    break;
                default:
                    return;
            }

            const next = categories[nextIndex];
            setActiveCategory(next.id);

            const el = itemRefs.current[nextIndex];
            el?.focus();
            el?.scrollIntoView({ block: "nearest" }); // ⭐ 加分点
        },
        [activeCategory, setActiveCategory]
    );

    const setItemRef = useCallback(
        (index: number) => (el: HTMLButtonElement | null) => {
            itemRefs.current[index] = el;
        },
        []
    );

    /* ===== auto scroll on active change ===== */
    useEffect(() => {
        const index = categories.findIndex(
            (c) => c.id === activeCategory
        );
        const el = itemRefs.current[index];
        el?.scrollIntoView({ block: "nearest" });
    }, [activeCategory]);

    return (
        <aside className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* logo */}
            <h1 className="p-6 text-2xl font-extrabold tracking-tight border-b border-gray-200 dark:border-gray-700">
                <span className="text-blue-500">Done</span>zo
            </h1>

            {/* nav */}
            <nav
                role="tablist"
                aria-label="タスクカテゴリー"
                aria-orientation="vertical"
                onKeyDown={handleKeyDown}
                className="flex-1 p-4 space-y-2 overflow-y-auto"
            >
                {categories.map((cat, index) => (
                    <SidebarItem
                        key={cat.id}
                        category={cat}
                        active={activeCategory === cat.id}
                        count={counts[cat.id]}
                        onSelect={handleSelect}
                        refCallback={setItemRef(index)}
                    />
                ))}
            </nav>
        </aside>
    );
}