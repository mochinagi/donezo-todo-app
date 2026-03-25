// Import the input component from the custom UI library / カスタムUIコンポーネントライブラリからInputコンポーネントをインポート
import { Input } from "@/components/ui/input";
// Import the search icon component from lucide-react / lucide-reactアイコンライブラリからSearchアイコンをインポート
import { Search } from "lucide-react";

// Define a category list with id and corresponding Japanese name / idと対応する日本語名を含むカテゴリ一覧を定義
const categories = [
    { id: 'myday', name: 'マイデイ' },          // My Day / 今日の予定
    { id: 'important', name: '重要' },         // Important / 重要
    { id: 'planned', name: '予定あり' },        // Planned / 予定あり
    { id: 'tasks', name: 'すべてのタスク' },    // All Tasks / すべてのタスク
];

// Define the Header component which receives categoryId, search keyword, and callback function for search input change / categoryId、検索キーワード、検索入力変更時のコールバック関数を受け取るHeaderコンポーネントを定義
export default function Header({
    categoryId,        // Currently selected category ID / 現在選択されているカテゴリID
    search,            // Current content of the search input / 検索ボックスの現在の内容
    onSearchChange     // Function called when search input changes, passing new value / 検索入力が変更されたときに新しい値を渡して呼び出される関数
}: {
    categoryId: string;
    search: string;
    onSearchChange: (value: string) => void;
}) {
    // Find the corresponding category name by categoryId, default to "タスク" if not found / categoryIdから該当するカテゴリ名を取得。見つからない場合は「タスク」を表示
    const categoryName = categories.find(c => c.id === categoryId)?.name || "タスク";

    return (
        // Header container with horizontal layout, centered content, white background, padding, and bottom border / 横並び・中央揃え・白背景・パディング・下線ボーダーを備えたヘッダーコンテナ
        <header className="flex items-center justify-between bg-white px-6 py-4 border-b border-gray-300">

            {/* Display the current category name in large bold font / 現在のカテゴリ名を大きく太字で表示 */}
            <h2 className="text-3xl font-bold">{categoryName}</h2>

            {/* Search box container with fixed width and relative positioning for placing the icon / 固定幅とアイコン配置用の相対位置指定された検索ボックスのコンテナ */}
            <div className="relative w-64">

                {/* Input component / 入力コンポーネント */}
                <Input
                    placeholder="検索"                      // Placeholder: "Search" in Japanese / プレースホルダー：「検索」
                    value={search}                       // Bind input value to search variable / 入力値をsearch変数にバインド
                    onChange={e => onSearchChange(e.target.value)} // Call onSearchChange with new value on change / 入力が変わったらonSearchChangeに新しい値を渡す
                    className="pl-10"                   // Add left padding for icon space / アイコンのスペースを確保するため左パディングを追加
                />

                {/* Search icon, absolutely positioned in the center left of the input box / 検索アイコン。入力ボックスの左側中央に絶対配置 */}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
        </header>
    );
}
