import { CheckCircle2, Star, Calendar, List } from "lucide-react";

/**
 * カテゴリ定義
 * 将来的にアイコンやバッジなど拡張しやすい構造にする
 */
const categories = [
    { id: 'myday', name: 'マイデイ', icon: CheckCircle2 },
    { id: 'important', name: '重要', icon: Star },
    { id: 'planned', name: '予定あり', icon: Calendar },
    { id: 'tasks', name: 'すべてのタスク', icon: List },
];

/**
 * サイドバー内の単一アイテム
 */
function SidebarItem({
    id,
    name,
    icon: Icon,
    active,
    onClick
}: {
    id: string;
    name: string;
    icon: any;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 w-full text-left px-4 py-2 rounded-md transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-400
            ${active
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-blue-100"
                }`}
        >
            {/* アクティブ時の左インジケーター */}
            {active && (
                <span className="absolute left-0 top-0 h-full w-1 bg-blue-700 rounded-r-md" />
            )}

            {/* アイコン */}
            <Icon size={18} />

            {/* カテゴリ名 */}
            <span>{name}</span>
        </button>
    );
}

/**
 * サイドバーコンポーネント
 * カテゴリ切り替えナビゲーションを提供
 */
export default function Sidebar({
    active,
    onChange
}: {
    active: string;
    onChange: (id: string) => void;
}) {
    return (
        <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">

            {/* ヘッダー */}
            <div className="p-6 text-2xl font-extrabold border-b border-gray-200">
                Donezo
            </div>

            {/* ナビゲーション */}
            <nav
                role="navigation"
                className="flex-1 p-4 space-y-2"
            >
                {categories.map((cat) => (
                    <SidebarItem
                        key={cat.id}
                        id={cat.id}
                        name={cat.name}
                        icon={cat.icon}
                        active={active === cat.id}
                        onClick={() => onChange(cat.id)}
                    />
                ))}
            </nav>
        </aside>
    );
}