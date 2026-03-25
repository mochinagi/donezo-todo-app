import { Input } from "@/components/ui/input";  // Import the input component from the custom UI library / カスタムUIライブラリからInputコンポーネントをインポート
import { Button } from "@/components/ui/button"; // Import the button component from the custom UI library / カスタムUIライブラリからButtonコンポーネントをインポート

// Define an AddTodo component for adding new tasks / 新しいタスクを追加するためのAddTodoコンポーネントを定義
export default function AddTodo({
    input,       // Current value of the input field (string) / 入力フィールドの現在の値（文字列）
    setInput,    // Function to update the input value / 入力値を更新する関数
    onAdd        // Function triggered when clicking add button or pressing Enter / 追加ボタンをクリックまたはEnterキーを押した時に実行される関数
}: {
    input: string;
    setInput: (val: string) => void;
    onAdd: () => void;
}) {
    return (
        // Outer container with padding, background, border, horizontal layout and spacing / パディング、背景、ボーダー、横並びと間隔を設定した外部コンテナ
        <div className="p-6 bg-white border-b border-gray-300 flex gap-3">

            {/* Input field / 入力フィールド */}
            <Input
                className="flex-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={input}                            // Bind input value to input variable / 入力値をinput変数にバインド
                onChange={e => setInput(e.target.value)} // Call setInput to update state when input changes / 入力が変更されたときにsetInputで状態を更新
                placeholder="新しいタスクを追加"         // Placeholder text in Japanese: Add a new task / プレースホルダー：新しいタスクを追加
                onKeyDown={e => {                        // Listen for key events / キーイベントを監視
                    if (e.key === "Enter") onAdd();       // If Enter is pressed, trigger the add operation / Enterキーが押されたら追加操作を実行
                }}
            />

            {/* Add button / 追加ボタン */}
            <Button
                onClick={onAdd}                         // Trigger add operation when button is clicked / ボタンをクリックしたときに追加操作を実行
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-md text-white shadow-sm"
            >
                追加 {/* Button text: "Add" in Japanese / ボタンの表示文字：「追加」 */}
            </Button>
        </div>
    );
}
