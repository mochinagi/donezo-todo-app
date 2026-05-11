"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
    Archive,
    CheckCircle2,
    Circle,
    List,
    PanelLeftClose,
    PanelLeftOpen,
    Timer,
} from "lucide-react";

import { shallow } from "zustand/shallow";

import { useTodoStore } from "@/store/todoStore";

import { cn } from "@/lib/utils";

type CategoryId =
    | "tasks"
    | "active"
    | "completed"
    | "archived";

type SidebarCategory = {
    id: CategoryId;
    label: string;
    icon: typeof List;
};

const STORAGE_KEY = "donezo-sidebar";

const categories: SidebarCategory[] = [
    {
        id: "tasks",
        label: "すべて",
        icon: List,
    },
    {
        id: "active",
        label: "未完了",
        icon: Circle,
    },
    {
        id: "completed",
        label: "完了済み",
        icon: CheckCircle2,
    },
    {
        id: "archived",
        label: "アーカイブ",
        icon: Archive,
    },
];

const loadCollapsed = () => {
    if (typeof window === "undefined") {
        return false;
    }

    return localStorage.getItem(STORAGE_KEY) === "true";
};

export default function Sidebar() {
    const {
        todos,
        activeCategory,
        setActiveCategory,
    } = useTodoStore(
        state => ({
            todos: state.todos,
            activeCategory: state.activeCategory,
            setActiveCategory: state.setActiveCategory,
        }),
        shallow
    );

    const [collapsed, setCollapsed] = useState(false);

    const itemRefs = useRef<(HTMLButtonElement | null)[]>(
        []
    );

    useEffect(() => {
        setCollapsed(loadCollapsed());
    }, []);

    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY,
            String(collapsed)
        );
    }, [collapsed]);

    const stats = useMemo(() => {
        let completed = 0;
        let archived = 0;
        let overdue = 0;

        const current = Date.now();

        for (const todo of todos) {
            if (todo.completed) {
                completed++;
            }

            if (todo.archived) {
                archived++;
            }

            if (
                todo.dueDate &&
                !todo.completed &&
                !todo.archived &&
                todo.dueDate < current
            ) {
                overdue++;
            }
        }

        return {
            tasks: todos.length,
            active:
                todos.length - completed - archived,
            completed,
            archived,
            overdue,
            progress:
                todos.length === 0
                    ? 0
                    : Math.round(
                        (completed / todos.length) * 100
                    ),
        };
    }, [todos]);

    const activeIndex = categories.findIndex(
        item => item.id === activeCategory
    );

    useEffect(() => {
        itemRefs.current[activeIndex]?.focus();
    }, [activeIndex]);

    return (
        <aside
            className={cn(
                "flex h-full flex-col border-r border-zinc-200 bg-white transition-all duration-200",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            <div className="border-b border-zinc-200 px-4 py-4">
                <div className="flex items-start justify-between">
                    {!collapsed && (
                        <div>
                            <h1 className="text-base font-semibold tracking-tight">
                                Donezo
                            </h1>

                            <p className="mt-1 text-xs text-zinc-500">
                                Personal workspace
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() =>
                            setCollapsed(value => !value)
                        }
                        className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    >
                        {collapsed ? (
                            <PanelLeftOpen size={18} />
                        ) : (
                            <PanelLeftClose size={18} />
                        )}
                    </button>
                </div>

                {!collapsed && (
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-zinc-500">
                                Progress
                            </span>

                            <span className="font-medium text-zinc-700">
                                {stats.progress}%
                            </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                            <div
                                className="h-full rounded-full bg-zinc-900 transition-all"
                                style={{
                                    width: `${stats.progress}%`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-3">
                {categories.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            ref={el => {
                                itemRefs.current[index] =
                                    el;
                            }}
                            type="button"
                            onClick={() =>
                                setActiveCategory(item.id)
                            }
                            className={cn(
                                "flex items-center rounded-xl transition-colors",
                                collapsed
                                    ? "justify-center px-2 py-3"
                                    : "justify-between px-3 py-2.5",
                                activeCategory === item.id
                                    ? "bg-zinc-900 text-white"
                                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center",
                                    collapsed
                                        ? ""
                                        : "gap-3"
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
                                <span
                                    className={cn(
                                        "min-w-[24px] rounded-full px-2 py-0.5 text-center text-xs",
                                        activeCategory ===
                                            item.id
                                            ? "bg-white/15 text-white"
                                            : "bg-zinc-100 text-zinc-600"
                                    )}
                                >
                                    {stats[item.id]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {!collapsed && (
                <div className="border-t border-zinc-200 p-4">
                    <div className="rounded-xl bg-zinc-50 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                            <Timer size={16} />

                            <span>Overdue</span>
                        </div>

                        <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                            {stats.overdue}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                            Pending tasks past due date
                        </p>
                    </div>
                </div>
            )}
        </aside>
    );
}