"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import clsx from "clsx";
import { toast } from "sonner";

interface AddTodoProps {
    input: string;
    setInput: (val: string) => void;
    onAdd: () => void;
}

export default function AddTodo({ input, setInput, onAdd }: AddTodoProps) {
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const MAX_LENGTH = 100;

    const validate = (value: string) => {
        const trimmed = value.trim();

        if (!trimmed) return "タスク内容を入力してください";
        if (trimmed.length > MAX_LENGTH)
            return `タスクは${MAX_LENGTH}文字以内で入力してください`;

        return "";
    };

    const handleAdd = useCallback(async () => {
        const err = validate(input);
        if (err) {
            setError(err);
            return;
        }

        try {
            setIsSubmitting(true);

            onAdd(); // 外部でstate更新

            toast.success("タスクを追加しました");

            setInput("");
            setError("");

            inputRef.current?.focus();
        } finally {
            setIsSubmitting(false);
        }
    }, [input, onAdd, setInput]);

    return (
        <div className="p-6 bg-white border-b border-gray-200 space-y-2">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    {/* 输入栏 */}
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder="やることを入力..."
                        aria-label="タスク入力欄"
                        aria-describedby={error ? "todo-error" : undefined}
                        aria-invalid={!!error}
                        maxLength={MAX_LENGTH}
                        className="pl-10 pr-3 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-shadow rounded-md"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAdd();
                        }}
                        autoFocus
                    />

                    {/* 图标 */}
                    <Plus
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                </div>

                {/* 按钮 */}
                <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={!input.trim() || isSubmitting}
                    aria-label="タスク追加"
                    className={clsx(
                        "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2 text-white rounded-md shadow-sm transition transform",
                        "hover:scale-105 active:scale-95",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    <Plus size={16} />
                    {isSubmitting ? "追加中..." : "追加"}
                </Button>
            </div>

            {/* 错误 */}
            {error && (
                <div
                    id="todo-error"
                    className="flex items-center gap-1 text-sm text-red-500 transition-opacity duration-300"
                    role="alert"
                    aria-live="polite"
                >
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}
        </div>
    );
}