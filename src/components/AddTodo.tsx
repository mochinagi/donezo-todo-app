import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useState } from "react";

/**
 * タスク追加コンポーネント
 * 入力と追加操作を担当
 */
export default function AddTodo({
    input,
    setInput,
    onAdd
}: {
    input: string;
    setInput: (val: string) => void;
    onAdd: () => void;
}) {

    // エラーメッセージ管理
    const [error, setError] = useState("");

    /**
     * タスク追加処理
     * 空入力チェック + 入力リセット
     */
    const handleAdd = () => {
        if (!input.trim()) {
            setError("タスク内容を入力してください");
            return;
        }

        onAdd();
        setInput("");
        setError("");
    };

    return (
        <div className="p-6 bg-white border-b border-gray-200 space-y-2">

            {/* 入力エリア */}
            <div className="flex gap-3">

                <div className="relative flex-1">

                    {/* 入力欄 */}
                    <Input
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder="やることを入力..."
                        aria-label="タスク入力欄"
                        aria-describedby={error ? "todo-error" : undefined}
                        maxLength={100}
                        className="pl-10 pr-3 focus:ring-2 focus:ring-blue-400"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAdd();
                        }}
                    />

                    {/* アイコン */}
                    <Plus
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                </div>

                {/* 追加ボタン */}
                <Button
                    onClick={handleAdd}
                    disabled={!input.trim()}
                    aria-label="タスク追加"
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-5 py-2 text-white rounded-md shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={16} />
                    追加
                </Button>
            </div>

            {/* エラーメッセージ */}
            {error && (
                <div
                    id="todo-error"
                    className="flex items-center gap-1 text-sm text-red-500"
                >
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}
        </div>
    );
}