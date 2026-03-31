import { memo } from "react";
import { CheckCircle2, Star, Calendar, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * カテゴリ型定義
 */
type Category = {
    id: string;
    name: string;
    icon: LucideIcon;
    count?: number; // 将来用（タスク数など）
};

/**
 * カテゴリ一覧
 */
const categories: Category[] = [
    { id: "myday", name: "マイデイ", icon: CheckCircle2 },
    { id: "important", name: "重要", icon: Star },
    { id: "planned", name: "予定あり", icon: Calendar },
    { id: "tasks", name: "すべてのタスク", icon: List },
];

/**
 * SidebarItem Props
 */
type SidebarItemProps = {
    category: Category;
    active: boolean;
    onClick: () => void;
};

/**
 * 単一ナビアイテム
 */
const SidebarItem = memo(function SidebarItem({
    category,
    active,
    onClick
}: SidebarItemProps) {
    const { name, icon: Icon, count } = category;

    return (
        <button
            onClick={onClick}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center justify-between w-full px-4 py-2 rounded-md text-left
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
            ${active
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-blue-100"
                }`}
        >
            {/* 左インジケーター */}
            {active && (
                <span className="absolute left-0 top-0 h-full w-1 bg-blue-700 rounded-r-md" />
            )}

            <div className="flex items-center gap-3">
                <Icon
                    size={18}
                    className={`transition-transform duration-200 
                    ${!active && "group-hover:scale-110"}`}
                />
                <span>{name}</span>
            </div>

            {/* 将来のバッジ */}
            {count !== undefined && (
                <span
                    className={`text-xs px-2 py-0.5 rounded-full
                    ${active
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
});

/**
 * Sidebar Props
 */
type SidebarProps = {
    active: string;
    onChange: (id: string) => void;
};

/**
 * サイドバー
 */
export default function Sidebar({
    active,
    onChange
}: SidebarProps) {
    return (
        <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">

            {/* Header */}
            <div className="p-6 text-2xl font-extrabold border-b border-gray-200 tracking-tight">
                Donezo
            </div>

            {/* Navigation */}
            <nav
                role="tablist"
                className="flex-1 p-4 space-y-2"
            >
                {categories.map((cat) => (
                    <SidebarItem
                        key={cat.id}
                        category={cat}
                        active={active === cat.id}
                        onClick={() => onChange(cat.id)}
                    />
                ))}
            </nav>
        </aside>
    );
}