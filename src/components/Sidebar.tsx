// Define an array of task categories, each with a unique id and corresponding Japanese name / タスクのカテゴリ配列を定義。各カテゴリはユニークなidと対応する日本語名を持つ
const categories = [
    { id: 'myday', name: 'マイデイ' },          // My Day / マイデイ
    { id: 'important', name: '重要' },         // Important / 重要
    { id: 'planned', name: '予定あり' },        // Planned / 予定あり
    { id: 'tasks', name: 'すべてのタスク' },    // All Tasks / すべてのタスク
];

// Define Sidebar component which receives the currently active category id and a callback when category changes / 現在アクティブなカテゴリIDとカテゴリ切り替え時のコールバックを受け取るSidebarコンポーネントを定義
export default function Sidebar({
    active,                  // Currently selected category id / 現在選択されているカテゴリID
    onChange                 // Called when switching category, passing the selected category id / カテゴリ切り替え時に呼ばれ、選択されたカテゴリIDを渡す関数
}: {
    active: string;
    onChange: (id: string) => void;
}) {
    return (
        // Sidebar container with fixed width, white background, right border, and vertical layout / 固定幅・白背景・右ボーダー・縦並びのサイドバーコンテナ
        <aside className="w-60 bg-white border-r border-gray-300 flex flex-col">

            {/* Sidebar header area with padding, bold font, and bottom border / パディング・太字・下ボーダーがあるサイドバーのヘッダーエリア */}
            <div className="p-6 text-2xl font-extrabold border-b border-gray-300">
                Donezo {/* App or sidebar name / アプリ名またはサイドバー名 */}
            </div>

            {/* Navigation area taking remaining space, with padding and vertical spacing between buttons / 残りのスペースを占め、パディングとボタン間の垂直間隔を持つナビゲーションエリア */}
            <nav className="flex-1 p-4 space-y-2">

                {/* Map through categories array to generate a button for each category / categories配列をマップして各カテゴリのボタンを生成 */}
                {categories.map(cat => (
                    <button
                        key={cat.id}                  // Unique key required by React to avoid rendering issues / Reactがレンダリング問題を避けるために必要なユニークキー
                        onClick={() => onChange(cat.id)}  // Call onChange with current category id on click / クリック時に現在のカテゴリIDをonChangeに渡して呼び出す
                        // Button styles:
                        // Full width, left-aligned text, padding, rounded corners
                        // Light blue background on hover
                        // Blue background, white text, and bold font if active
                        // Otherwise gray text
                        // ボタンスタイル：
                        // 幅100%、左寄せテキスト、パディング、角丸
                        // ホバー時は薄い青背景
                        // アクティブなら青背景・白文字・太字
                        // それ以外はグレー文字
                        className={`w-full text-left px-4 py-2 rounded-md hover:bg-blue-100 ${active === cat.id ? "bg-blue-500 text-white font-semibold" : "text-gray-700"}`}
                    >
                        {cat.name} {/* Display category name / カテゴリ名を表示 */}
                    </button>
                ))}

            </nav>
        </aside>
    );
}
