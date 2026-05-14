"use client";

import { useState } from "react";

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

const STORAGE_KEY =
    "donezo-sidebar-collapsed";

const categories: SidebarCategory[] =
    [
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

function getInitialCollapsed() {
    if (
        typeof window ===
        "undefined"
    ) {
        return false;
    }

    return (
        localStorage.getItem(
            STORAGE_KEY
        ) === "true"
    );
}

export default function Sidebar() {
    const {
        todos,
        activeCategory,
        setActiveCategory,
    } = useTodoStore(
        state => ({
            todos: state.todos,

            activeCategory:
                state.activeCategory,

            setActiveCategory:
                state.setActiveCategory,
        }),
        shallow
    );

    const [collapsed, setCollapsed] =
        useState(
            getInitialCollapsed
        );

    const currentTime =
        Date.now();

    let completed = 0;

    let archived = 0;

    let overdue = 0;

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
            todo.dueDate < currentTime
        ) {
            overdue++;
        }
    }

    const stats = {
        tasks: todos.length,

        active:
            todos.length -
            completed -
            archived,

        completed,

        archived,

        overdue,

        completionRate:
            todos.length === 0
                ? 0
                : Math.round(
                    (completed /
                        todos.length) *
                    100
                ),
    };

    const toggleCollapsed = () => {
        setCollapsed(current => {
            const next =
                !current;

            localStorage.setItem(
                STORAGE_KEY,
                String(next)
            );

            return next;
        });
    };

    return (
        <aside
            className={cn(
                "flex h-full shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-300 dark:border-zinc-800 dark:bg-zinc-950",
                collapsed
                    ? "w-[76px]"
                    : "w-[272px]"
            )}
        >
            <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                    {!collapsed && (
                        <div>
                            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                                Donezo
                            </h1>

                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                Task workspace
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={
                            toggleCollapsed
                        }
                        aria-label={
                            collapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"
                        }
                        className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                    >
                        {collapsed ? (
                            <PanelLeftOpen
                                size={
                                    18
                                }
                            />
                        ) : (
                            <PanelLeftClose
                                size={
                                    18
                                }
                            />
                        )}
                    </button>
                </div>

                {!collapsed && (
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-zinc-500 dark:text-zinc-400">
                                Completion
                            </span>

                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                {
                                    stats.completionRate
                                }
                                %
                            </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                                className="h-full rounded-full bg-zinc-900 transition-[width] duration-300 dark:bg-zinc-100"
                                style={{
                                    width: `${stats.completionRate}%`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-3">
                {categories.map(
                    item => {
                        const Icon =
                            item.icon;

                        const active =
                            activeCategory ===
                            item.id;

                        return (
                            <button
                                key={
                                    item.id
                                }
                                type="button"
                                aria-current={
                                    active
                                        ? "page"
                                        : undefined
                                }
                                onClick={() =>
                                    setActiveCategory(
                                        item.id
                                    )
                                }
                                className={cn(
                                    "flex items-center rounded-xl transition-colors",
                                    collapsed
                                        ? "justify-center px-2 py-3"
                                        : "justify-between px-3 py-2.5",
                                    active
                                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex items-center",
                                        !collapsed &&
                                        "gap-3"
                                    )}
                                >
                                    <Icon
                                        size={
                                            18
                                        }
                                    />

                                    {!collapsed && (
                                        <span className="text-sm font-medium">
                                            {
                                                item.label
                                            }
                                        </span>
                                    )}
                                </div>

                                {!collapsed && (
                                    <span
                                        className={cn(
                                            "min-w-[24px] rounded-full px-2 py-0.5 text-center text-xs",
                                            active
                                                ? "bg-white/15 text-white dark:bg-zinc-900/10 dark:text-zinc-900"
                                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                        )}
                                    >
                                        {
                                            stats[
                                            item
                                                .id
                                            ]
                                        }
                                    </span>
                                )}
                            </button>
                        );
                    }
                )}
            </nav>

            {!collapsed && (
                <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            <Timer
                                size={16}
                            />

                            <span>
                                Overdue
                            </span>
                        </div>

                        <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                            {
                                stats.overdue
                            }
                        </p>

                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Tasks past their
                            due date
                        </p>
                    </div>
                </div>
            )}
        </aside>
    );
}