"use client";

import { memo, useMemo, useCallback, useRef } from "react";
import {
    CheckCircle2,
    Circle,
    List,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";

const categories = [
    { id: "tasks", name: "すべてのタスク", icon: List },
    { id: "active", name: "未完了", icon: Circle },
    { id: "completed", name: "完了済み", icon: CheckCircle2 },
] as const;

type CategoryId = typeof categories[number]["id"];

interface SidebarItemProps {
    id: CategoryId;
    name: string;
    Icon: LucideIcon;
    active: boolean;
    count: number;
    onSelect: (id: CategoryId) => void;
    setRef: (el: HTMLButtonElement | null) => void;
}

const SidebarItem = memo(function SidebarItem({
    id,
    name,
    Icon,
    active,
    count,
    onSelect,
    setRef,
}: SidebarItemProps) {
    return (
        <button
            ref={setRef}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(id)}
            className={cn(
                "flex items-center justify-between w-full px-4 py-2 rounded-md text-sm transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                active
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} />
                <span>{name}</span>
            </div>

            <span
                className={cn(
                    "text-xs px-2 py-0.5 rounded-full min-w-[22px] text-center",
                    active
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600"
                )}
            >
                {count}
            </span>
        </button>
    );
});

export default function Sidebar() {
    const { total, completed, activeCategory, setActiveCategory } =
        useTodoStore(
            (s) => ({
                total: s.total,
                completed: s.completed,
                activeCategory: s.activeCategory,
                setActiveCategory: s.setActiveCategory,
            }),
            shallow
        );

    const counts = useMemo(
        () => ({
            tasks: total,
            active: total - completed,
            completed,
        }),
        [total, completed]
    );

    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const focusIndex = categories.findIndex(
        (c) => c.id === activeCategory
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            let nextIndex = focusIndex;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                nextIndex = (focusIndex + 1) % categories.length;
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                nextIndex =
                    (focusIndex - 1 + categories.length) %
                    categories.length;
            } else if (e.key === "Home") {
                e.preventDefault();
                nextIndex = 0;
            } else if (e.key === "End") {
                e.preventDefault();
                nextIndex = categories.length - 1;
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveCategory(categories[focusIndex].id);
                return;
            } else {
                return;
            }

            const el = itemRefs.current[nextIndex];
            el?.focus();
        },
        [focusIndex, setActiveCategory]
    );

    return (
        <aside className="w-60 border-r border-gray-200 bg-white flex flex-col">
            <div className="px-5 py-4 border-b text-xl font-semibold">
                Donezo
            </div>

            <nav
                role="tablist"
                aria-orientation="vertical"
                onKeyDown={handleKeyDown}
                className="p-3 space-y-1"
            >
                {categories.map((cat, index) => (
                    <SidebarItem
                        key={cat.id}
                        id={cat.id}
                        name={cat.name}
                        Icon={cat.icon}
                        active={activeCategory === cat.id}
                        count={counts[cat.id]}
                        onSelect={setActiveCategory}
                        setRef={(el) => (itemRefs.current[index] = el)}
                    />
                ))}
            </nav>
        </aside>
    );
}