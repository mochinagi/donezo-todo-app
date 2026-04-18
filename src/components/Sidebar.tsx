"use client";

import { memo, useMemo, useCallback, useRef } from "react";
import { CheckCircle2, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";
import { shallow } from "zustand/shallow";

/* ----------------------------- */
/* TYPES */
type CategoryId = "tasks" | "active" | "completed";

interface Category {
    id: CategoryId;
    name: string;
    icon: LucideIcon;
}

/* ----------------------------- */
/* CONFIG */
const categories: Category[] = [
    { id: "tasks", name: "すべてのタスク", icon: List },
    { id: "active", name: "未完了", icon: CheckCircle2 },
    { id: "completed", name: "完了済み", icon: CheckCircle2 },
];

/* ----------------------------- */
/* ITEM */
interface SidebarItemProps {
    category: Category;
    active: boolean;
    count: number;
    onSelect: (id: CategoryId) => void;
    buttonRef?: (el: HTMLButtonElement | null) => void;
}

const SidebarItem = memo(function SidebarItem({
    category,
    active,
    count,
    onSelect,
    buttonRef,
}: SidebarItemProps) {
    const { name, icon: Icon, id } = category;

    const handleClick = useCallback(() => {
        onSelect(id);
    }, [id, onSelect]);

    return (
        <button
            ref={buttonRef}
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
            <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r
                transition-all duration-200
                ${active ? "bg-blue-700 opacity-100" : "opacity-0 group-hover:opacity-50 bg-gray-400"}`}
            />

            <div className="flex items-center gap-3">
                <Icon size={18} />
                <span className="text-sm">{name}</span>
            </div>

            <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium
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
/* SIDEBAR */
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

    /* ---------------- select ---------------- */
    const handleSelect = useCallback(
        (id: CategoryId) => {
            setActiveCategory(id);
        },
        [setActiveCategory]
    );

    /* ---------------- keyboard nav ---------------- */
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!["ArrowUp", "ArrowDown"].includes(e.key)) return;

            e.preventDefault();

            const index = categories.findIndex(
                (c) => c.id === activeCategory
            );

            let nextIndex = index;

            if (e.key === "ArrowDown") {
                nextIndex = (index + 1) % categories.length;
            } else {
                nextIndex =
                    (index - 1 + categories.length) % categories.length;
            }

            const next = categories[nextIndex];
            setActiveCategory(next.id);

            itemRefs.current[nextIndex]?.focus();
        },
        [activeCategory, setActiveCategory]
    );

    return (
        <aside className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Logo */}
            <div className="p-6 text-2xl font-extrabold tracking-tight border-b border-gray-200 dark:border-gray-700">
                <span className="text-blue-500">Done</span>zo
            </div>

            {/* Navigation */}
            <nav
                role="tablist"
                onKeyDown={handleKeyDown}
                className="flex-1 p-4 space-y-2"
            >
                {categories.map((cat, index) => (
                    <SidebarItem
                        key={cat.id}
                        category={cat}
                        active={activeCategory === cat.id}
                        count={counts[cat.id]}
                        onSelect={handleSelect}
                        buttonRef={(el) => (itemRefs.current[index] = el)}
                    />
                ))}
            </nav>
        </aside>
    );
}