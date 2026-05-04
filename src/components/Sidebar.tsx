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
    refCallback: (el: HTMLButtonElement | null) => void;
}

const SidebarItem = memo(function SidebarItem({
    id,
    name,
    Icon,
    active,
    count,
    onSelect,
    refCallback,
}: SidebarItemProps) {
    const handleClick = useCallback(() => {
        onSelect(id);
    }, [id, onSelect]);

    return (
        <button
            ref={refCallback}
            type="button"
            onClick={handleClick}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={`group relative flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-left transition-all duration-200 focus:outline-none
                ${active
                    ? "bg-blue-500 text-white shadow-md scale-[1.02]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
        >
            <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r transition-all duration-200
                ${active
                        ? "bg-blue-700 opacity-100"
                        : "opacity-0 group-hover:opacity-40 bg-gray-400"
                    }`}
            />

            <div className="flex items-center gap-3">
                <Icon size={18} />
                <span className="text-sm">{name}</span>
            </div>

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

    const counts = useMemo(() => {
        let completed = 0;

        for (const t of todos) {
            if (t.completed) completed++;
        }

        const total = todos.length;

        return {
            tasks: total,
            active: total - completed,
            completed,
        };
    }, [todos]);

    const handleSelect = useCallback(
        (id: CategoryId) => {
            setActiveCategory(id);
        },
        [setActiveCategory]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const currentIndex = categories.findIndex(
                (c) => c.id === activeCategory
            );

            let nextIndex = currentIndex;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                nextIndex = (currentIndex + 1) % categories.length;
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                nextIndex =
                    (currentIndex - 1 + categories.length) %
                    categories.length;
            } else if (e.key === "Home") {
                e.preventDefault();
                nextIndex = 0;
            } else if (e.key === "End") {
                e.preventDefault();
                nextIndex = categories.length - 1;
            } else {
                return;
            }

            const next = categories[nextIndex];
            setActiveCategory(next.id);

            const el = itemRefs.current[nextIndex];
            if (el) {
                el.focus();
                el.scrollIntoView({ block: "nearest" });
            }
        },
        [activeCategory, setActiveCategory]
    );

    const setItemRef = useCallback(
        (index: number) => (el: HTMLButtonElement | null) => {
            itemRefs.current[index] = el;
        },
        []
    );

    useEffect(() => {
        const index = categories.findIndex(
            (c) => c.id === activeCategory
        );
        const el = itemRefs.current[index];
        el?.scrollIntoView({ block: "nearest" });
    }, [activeCategory]);

    return (
        <aside className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <h1 className="p-6 text-2xl font-extrabold tracking-tight border-b border-gray-200 dark:border-gray-700">
                <span className="text-blue-500">Done</span>zo
            </h1>

            <nav
                role="tablist"
                aria-orientation="vertical"
                onKeyDown={handleKeyDown}
                className="flex-1 p-4 space-y-2 overflow-y-auto"
            >
                {categories.map((cat, index) => (
                    <SidebarItem
                        key={cat.id}
                        id={cat.id}
                        name={cat.name}
                        Icon={cat.icon}
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