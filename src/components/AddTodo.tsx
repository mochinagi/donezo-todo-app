"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { useTodoStore } from "@/store/todoStore";

/* ================= CONST ================= */

const MAX_LENGTH = 100;

/* ================= TYPES ================= */

type OnAdd = (text: string) => Promise<void> | void;

interface AddTodoProps {
    input: string;
    setInput: (val: string) => void;
    onAdd: OnAdd;
}

/* ================= COMPONENT ================= */

export default function AddTodo({
    input,
    setInput,
    onAdd,
}: AddTodoProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const isComposingRef = useRef(false);

    // 🔥 从 store 读，做真正去重
    const todos = useTodoStore((s) => s.todos);

    /* ---------------- VALIDATION ---------------- */

    const validate = useCallback(
        (value: string): string => {
            const trimmed = value.trim();

            if (!trimmed) return "タスク内容を入力してください";

            if (trimmed.length > MAX_LENGTH) {
                return `タスクは${MAX_LENGTH}文字以内で入力してください`;
            }

            const exists = todos.some(
                (t) => t.text.toLowerCase() === trimmed.toLowerCase()
            );

            if (exists) {
                return "同じタスクはすでに存在します";
            }

            return "";
        },
        [todos]
    );

    const trimmed = input.trim();
    const trimmedLength = trimmed.length;
    const error = input ? validate(input) : "";

    /* ---------------- ADD ---------------- */

    const handleAdd = useCallback(async () => {
        if (isSubmitting) return;

        const value = input.trim();
        const err = validate(input);

        if (err) return;

        try {
            setIsSubmitting(true);

            await onAdd(value);

            toast.success(`「${value}」を追加しました`);

            setInput("");

            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });

        } catch {
            toast.error("タスクの追加に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    }, [input, onAdd, setInput, validate, isSubmitting]);

    /* ---------------- INPUT ---------------- */

    const handleChange = useCallback(
        (value: string) => {
            setInput(value);
        },
        [setInput]
    );

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").trim();
        setInput(text);
    };

    const lengthColor =
        trimmedLength > MAX_LENGTH
            ? "text-red-500"
            : trimmedLength > MAX_LENGTH * 0.8
                ? "text-yellow-500"
                : "text-gray-400";

    /* ---------------- KEYBOARD ---------------- */

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComposingRef.current) return;

        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }

        if (e.key === "Escape") {
            setInput("");
        }
    };

    return (
        <div
            className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur
            border-b border-gray-200 dark:border-gray-700 space-y-2"
        >
            <div className="flex gap-3">
                <div className="relative flex-1">

                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => handleChange(e.target.value)}
                        onPaste={handlePaste}
                        placeholder={
                            isSubmitting
                                ? "追加中..."
                                : "やることを入力して Enter..."
                        }
                        aria-label="タスク入力欄"
                        aria-invalid={!!error}
                        aria-describedby="todo-error"
                        maxLength={MAX_LENGTH}
                        disabled={isSubmitting}
                        className={clsx(
                            "pl-10 pr-12 rounded-lg transition-all",
                            "focus:ring-2 focus:ring-blue-400 focus:outline-none",
                            "hover:bg-gray-50 dark:hover:bg-gray-800",
                            isSubmitting && "cursor-not-allowed opacity-80",
                            error && "border-red-400 focus:ring-red-400"
                        )}
                        onKeyDown={handleKeyDown}
                        onCompositionStart={() => {
                            isComposingRef.current = true;
                        }}
                        onCompositionEnd={() => {
                            isComposingRef.current = false;
                        }}
                        autoFocus
                    />

                    <Plus
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <span
                        className={clsx(
                            "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                            lengthColor
                        )}
                    >
                        {trimmedLength}/{MAX_LENGTH}
                    </span>
                </div>

                <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={!trimmed || isSubmitting || !!error}
                    className={clsx(
                        "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white",
                        "px-5 py-2 rounded-lg shadow-sm transition-all",
                        "hover:scale-105 active:scale-95",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" size={16} />
                    ) : (
                        <Plus size={16} />
                    )}
                    {isSubmitting ? "追加中..." : "追加"}
                </Button>
            </div>

            {error && (
                <div
                    id="todo-error"
                    className="flex items-center gap-1 text-sm text-red-500"
                    role="alert"
                >
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}
        </div>
    );
}