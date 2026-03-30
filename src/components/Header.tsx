import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

/**
 * カテゴリ名マッピング
 * Sidebarと共通化することも可能
 */
const categoryMap: Record<string, string> = {
    myday: "マイデイ",
    important: "重要",
    planned: "予定あり",
    tasks: "すべてのタスク",
};

/**
 * ヘッダーコンポーネント
 * 現在のカテゴリ表示と検索機能を提供
 */
export default function Header({
    categoryId,
    search,
    onSearchChange
}: {
    categoryId: string;
    search: string;
    onSearchChange: (value: string) => void;
}) {

    // カテゴリ名取得（存在しない場合はデフォルト）
    const categoryName = categoryMap[categoryId] ?? "タスク";

    return (
        <header className="flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200">

            {/* タイトルエリア */}
            <div className="flex flex-col">
                <h2 className="text-3xl font-bold text-gray-900">
                    {categoryName}
                </h2>
                <p className="text-sm text-gray-400">
                    タスクを整理して効率よく進めましょう
                </p>
            </div>

            {/* 検索ボックス */}
            <div
                role="search"
                className="relative w-72"
            >
                {/* 入力欄 */}
                <Input
                    placeholder="タスクを検索..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-10 focus:ring-2 focus:ring-blue-400"
                    aria-label="タスク検索"
                />

                {/* 検索アイコン */}
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                />

                {/* クリアボタン（入力がある時のみ表示） */}
                {search && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        aria-label="検索をクリア"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </header>
    );
}