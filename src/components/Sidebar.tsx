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

type CategoryId =
    | "tasks"
    | "active"
    | "completed";

type SidebarCategory = {
    id: CategoryId;
    label: string;
    icon: LucideIcon;
    shortcut: string;
};

const SIDEBAR_STORAGE_KEY =
    "donezo-sidebar-collapsed";

const categories: SidebarCategory[] = [
    {
        id: "tasks",
        label: "すべてのタスク",
        icon: List,
        shortcut: "1",
    },
    {
        id: "active",
        label: "未完了",
        icon: Circle,
        shortcut: "2",
    },
    {
        id: "completed",
        label: "完了済み",
        icon: CheckCircle2,
        shortcut: "3",
    },
];

type SidebarItemProps = {
    item: SidebarCategory;
    active: boolean;
    collapsed: boolean;
    count: number;
    onSelect: (
        category: CategoryId
    ) => void;
    onRef: (
        element: HTMLButtonElement | null
    ) => void;
};

const SidebarItem = memo(
    function SidebarItem({
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
                role="tab"
                aria-selected={active}
                tabIndex={
                    active ? 0 : -1
                }
                onClick={() =>
                    onSelect(item.id)
                }
                className={cn(
                    "group relative flex w-full items-center rounded-xl transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                    collapsed
                        ? "justify-center px-2 py-3"
                        : "justify-between px-3 py-2.5",
                    active
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
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400">
                            ⌘
                            {
                                item.shortcut
                            }
                        </span>

                        <span
                            className={cn(
                                "min-w-[24px] rounded-full px-2 py-0.5 text-center text-xs",
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
    }
);

export default function Sidebar() {
    const {
        todos,
        activeCategory,
        setActiveCategory,
    } = useTodoStore(
        (state) => ({
            todos: state.todos,
            activeCategory:
                state.activeCategory,
            setActiveCategory:
                state.setActiveCategory,
        }),
        shallow
    );

    const [
        collapsed,
        setCollapsed,
    ] = useState(false);

    const itemRefs = useRef<
        (HTMLButtonElement | null)[]
    >([]);

    useEffect(() => {
        const saved =
            localStorage.getItem(
                SIDEBAR_STORAGE_KEY
            );

        setCollapsed(
            saved === "true"
        );
    }, []);

    useEffect(() => {
        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            String(collapsed)
        );
    }, [collapsed]);

    const counts = useMemo(() => {
        const completed =
            todos.filter(
                (todo) =>
                    todo.completed
            ).length;

        return {
            tasks: todos.length,
            active:
                todos.length -
                completed,
            completed,
        };
    }, [todos]);

    const activeIndex = useMemo(
        () =>
            categories.findIndex(
                (category) =>
                    category.id ===
                    activeCategory
            ),
        [activeCategory]
    );

    useEffect(() => {
        itemRefs.current[
            activeIndex
        ]?.focus();
    }, [activeIndex]);

    const moveFocus = useCallback(
        (index: number) => {
            itemRefs.current[
                index
            ]?.focus();
        },
        []
    );

    const handleKeyDown =
        useCallback(
            (
                event: React.KeyboardEvent
            ) => {
                const actions: Record<
                    string,
                    () => void
                > = {
                    ArrowDown: () => {
                        moveFocus(
                            (activeIndex +
                                1) %
                            categories.length
                        );
                    },

                    ArrowUp: () => {
                        moveFocus(
                            (activeIndex -
                                1 +
                                categories.length) %
                            categories.length
                        );
                    },

                    Home: () => {
                        moveFocus(0);
                    },

                    End: () => {
                        moveFocus(
                            categories.length -
                            1
                        );
                    },

                    Enter: () => {
                        setActiveCategory(
                            categories[
                                activeIndex
                            ].id
                        );
                    },

                    " ": () => {
                        setActiveCategory(
                            categories[
                                activeIndex
                            ].id
                        );
                    },
                };

                const action =
                    actions[
                    event.key
                    ];

                if (!action) {
                    return;
                }

                event.preventDefault();

                action();
            },
            [
                activeIndex,
                moveFocus,
                setActiveCategory,
            ]
        );

    return (
        <aside
            className={cn(
                "flex h-full flex-col border-r border-zinc-200 bg-white transition-all duration-200",
                collapsed
                    ? "w-[72px]"
                    : "w-64"
            )}
        >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
                {!collapsed && (
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-900">
                            Donezo
                        </h1>

                        <p className="text-xs text-zinc-500">
                            Task workspace
                        </p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() =>
                        setCollapsed(
                            (
                                prev
                            ) => !prev
                        )
                    }
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                    {collapsed ? (
                        <PanelLeftOpen
                            size={18}
                        />
                    ) : (
                        <PanelLeftClose
                            size={18}
                        />
                    )}
                </button>
            </div>

            <nav
                role="tablist"
                aria-orientation="vertical"
                onKeyDown={
                    handleKeyDown
                }
                className="flex flex-1 flex-col gap-1 p-3"
            >
                {categories.map(
                    (
                        item,
                        index
                    ) => (
                        <SidebarItem
                            key={
                                item.id
                            }
                            item={item}
                            active={
                                activeCategory ===
                                item.id
                            }
                            collapsed={
                                collapsed
                            }
                            count={
                                counts[
                                item.id
                                ]
                            }
                            onSelect={
                                setActiveCategory
                            }
                            onRef={(
                                element
                            ) => {
                                itemRefs.current[
                                    index
                                ] =
                                    element;
                            }}
                        />
                    )
                )}
            </nav>
        </aside>
    );
}