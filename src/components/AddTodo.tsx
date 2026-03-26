import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AddTodo({
    input,
    setInput,
    onAdd
}: {
    input: string;
    setInput: (val: string) => void;
    onAdd: () => void;
}) {

    // タスク追加処理（空入力防止）
    const handleAdd = () => {
        if (!input.trim()) return;
        onAdd();
    };

    return (
        <div className="p-6 bg-white border-b border-gray-300 flex gap-3">

            <Input
                className="flex-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="やることを入力..."
                aria-label="タスク入力欄"
                onKeyDown={e => {
                    if (e.key === "Enter") handleAdd();
                }}
            />

            <Button
                onClick={handleAdd}
                disabled={!input.trim()} // 空入力時はボタン無効化
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-md text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                追加
            </Button>
        </div>
    );
}