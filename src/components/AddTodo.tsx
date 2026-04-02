"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import clsx from "clsx";

interface AddTodoProps {
    input: string;
    setInput: (val: string) => void;
    onAdd: () => void;
}

export default function AddTodo({ input, setInput, onAdd }: AddTodoProps) {
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAdd = useCallback(() => {
        const trimmedInput = input.trim();
        if (!trimmedInput) {
            setError("タスク内容を入力してください");
            return;
        }

        onAdd();
        setInput("");
        setError("");
        inputRef.current?.focus();
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
                        maxLength={100}
                        className="pl-10 pr-3 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-shadow rounded-md"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAdd();
                        }}
                        autoFocus
                    />

                    {/* 输入栏图标 */}
                    <Plus
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                </div>

                {/* 添加按钮 */}
                <Button
                    onClick={handleAdd}
                    disabled={!input.trim()}
                    aria-label="タスク追加"
                    className={clsx(
                        "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2 text-white rounded-md shadow-sm transition transform disabled:opacity-50 disabled:cursor-not-allowed",
                        "hover:scale-105 active:scale-95"
                    )}
                >
                    <Plus size={16} />
                    追加
                </Button>
            </div>

            {/* 错误信息 */}
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