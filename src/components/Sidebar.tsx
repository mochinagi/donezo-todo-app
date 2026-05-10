"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    CheckCircle2,
    Circle,
    List,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { shallow } from "zustand/shallow";

import { useTodoStore } from "@/store/todoStore";

import { cn } from "@/lib/utils";

type CategoryId = "tasks" | "active" | "completed";

type SidebarCategory = {
    id: CategoryId;
    label: string;
    icon: LucideIcon;
    shortcut: string;
};

const STORAGE_KEY = "donezo-sidebar-collapsed";

const loadCollapsed = () => localStorage.getItem(STORAGE_KEY) === "true";
const saveCollapsed = (v: boolean) =>
    localStorage.setItem(STORAGE_KEY, String(v));

const categories: SidebarCategory[] = [
    { id: "tasks", label: "すべてのタスク", icon: List, shortcut: "1" },
    { id: "active", label: "未完了", icon: Circle, shortcut: "2" },
    { id: "completed", label: "完了済み", icon: CheckCircle2, shortcut: "3" },
];

type SidebarItemProps = {
    item: SidebarCategory;
    active: boolean;
    collapsed: boolean;
    count: number;
    onSelect: (id: CategoryId) => void;
    onRef: (el: HTMLButtonElement | null) => void;
};

const SidebarItem = memo(function SidebarItem({
    item,
    active,
    collapsed,
    count,
    onSelect,
    onRef,
}: SidebarItemProps) {
    const Icon = item.icon;

    return (
        <button
            ref={onRef}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
                "flex w-full items-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-400",
                collapsed ? "justify-center px-2 py-3" : "justify-between px-3 py-2.5",
                active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            )}
        >
            <div
                className={cn(
                    "flex items-center",
                    collapsed ? "" : "gap-3"
                )}
            >
                <Icon size={18} />
                {!collapsed && (
                    <span className="text-sm font-medium">
                        {item.label}
                    </span>
                )}
            </div>

            {!collapsed && (
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">
                        ⌘{item.shortcut}
                    </span>

                    <span
                        className={cn(
                            "min-w-[24px] rounded-full px-2 py-0.5 text-xs text-center",
                            active
                                ? "bg-white/15 text-white"
                                : "bg-zinc-200 text-zinc-700"
                        )}
                    >
                        {count}
                    </span>
                </div>
            )}
        </button>
    );
});

export default function Sidebar() {
    const { todos, activeCategory, setActiveCategory } =
        useTodoStore(
            (s) => ({
                todos: s.todos,
                activeCategory: s.activeCategory,
                setActiveCategory: s.setActiveCategory,
            }),
            shallow
        );

    const [collapsed, setCollapsed] = useState(false);

    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        setCollapsed(loadCollapsed());
    }, []);

    useEffect(() => {
        saveCollapsed(collapsed);
    }, [collapsed]);

    const counts = useMemo(() => {
        let completed = 0;

        for (const t of todos) {
            if (t.completed) completed++;
        }

        return {
            tasks: todos.length,
            active: todos.length - completed,
            completed,
        };
    }, [todos]);

    const activeIndex = useMemo(
        () => categories.findIndex((c) => c.id === activeCategory),
        [activeCategory]
    );

    useEffect(() => {
        itemRefs.current[activeIndex]?.focus();
    }, [activeIndex]);

    const focusAt = useCallback((i: number) => {
        const next = (i + categories.length) % categories.length;
        itemRefs.current[next]?.focus();
    }, []);

    const selectCurrent = useCallback(() => {
        const current = categories[activeIndex];
        if (!current) return;
        setActiveCategory(current.id);
    }, [activeIndex, setActiveCategory]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    focusAt(activeIndex + 1);
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    focusAt(activeIndex - 1);
                    break;

                case "Home":
                    e.preventDefault();
                    focusAt(0);
                    break;

                case "End":
                    e.preventDefault();
                    focusAt(categories.length - 1);
                    break;

                case "Enter":
                case " ":
                    e.preventDefault();
                    selectCurrent();
                    break;
            }
        },
        [activeIndex, focusAt, selectCurrent]
    );

    return (
        <aside
            className={cn(
                "flex h-full flex-col border-r border-zinc-200 bg-white",
                collapsed ? "w-[72px]" : "w-64"
            )}
        >
            <div className="flex items-center justify-between border-b px-4 py-4">
                {!collapsed && (
                    <div>
                        <h1 className="text-lg font-semibold">Donezo</h1>
                        <p className="text-xs text-zinc-500">
                            Task workspace
                        </p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => setCollapsed((v) => !v)}
                    className="rounded-lg p-2 hover:bg-zinc-100"
                >
                    {collapsed ? (
                        <PanelLeftOpen size={18} />
                    ) : (
                        <PanelLeftClose size={18} />
                    )}
                </button>
            </div>

            <nav
                role="navigation"
                onKeyDown={handleKeyDown}
                className="flex flex-1 flex-col gap-1 p-3"
            >
                {categories.map((item, index) => (
                    <SidebarItem
                        key={item.id}
                        item={item}
                        active={activeCategory === item.id}
                        collapsed={collapsed}
                        count={counts[item.id]}
                        onSelect={setActiveCategory}
                        onRef={(el) => {
                            itemRefs.current[index] = el;
                        }}
                    />
                ))}
            </nav>
        </aside>
    );
}