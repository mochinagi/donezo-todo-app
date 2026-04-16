"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";
import clsx from "clsx";
import { toast } from "sonner";

/* ================= CONST ================= */

const MAX_LENGTH = 100;

/* ================= TYPES ================= */

interface AddTodoProps {
    input: string;
    setInput: (val: string) => void;
    onAdd: (text: string) => Promise<void> | void;
}

/* ================= COMPONENT ================= */

export default function AddTodo({
    input,
    setInput,
    onAdd,
}: AddTodoProps) {
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const isComposingRef = useRef(false);

    /* ---------------- VALIDATION ---------------- */

    const validate = useCallback((value: string): string => {
        const trimmed = value.trim();

        if (!trimmed) return "タスク内容を入力してください";
        if (trimmed.length > MAX_LENGTH)
            return `タスクは${MAX_LENGTH}文字以内で入力してください`;

        return "";
    }, []);

    const displayError = useMemo(() => {
        if (!input) return "";
        return error || validate(input);
    }, [input, error, validate]);

    /* ---------------- ADD ---------------- */

    const handleAdd = useCallback(async () => {
        if (isSubmitting) return;

        const trimmed = input.trim();
        const err = validate(trimmed);

        if (err) {
            setError(err);
            return;
        }

        try {
            setIsSubmitting(true);

            await onAdd(trimmed);

            toast.success(`「${trimmed}」を追加しました`);

            setInput("");
            setError("");

            // 🔥 focus + 选中（体验更好）
            inputRef.current?.focus();
            inputRef.current?.select();
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
            if (error) setError("");
        },
        [setInput, error]
    );

    const trimmedLength = input.trim().length;

    const lengthColor = useMemo(() => {
        if (trimmedLength > MAX_LENGTH) return "text-red-500";
        if (trimmedLength > MAX_LENGTH * 0.8) return "text-yellow-500";
        return "text-gray-400";
    }, [trimmedLength]);

    /* ---------------- KEYBOARD ---------------- */

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComposingRef.current) return;

        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }

        if (e.key === "Escape") {
            setInput("");
            setError("");
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
                        placeholder={
                            isSubmitting
                                ? "追加中..."
                                : "やることを入力して Enter..."
                        }
                        aria-label="タスク入力欄"
                        aria-invalid={!!displayError}
                        maxLength={MAX_LENGTH}
                        disabled={isSubmitting}
                        className={clsx(
                            "pl-10 pr-12 rounded-lg transition-all",
                            "focus:ring-2 focus:ring-blue-400 focus:outline-none",
                            "hover:bg-gray-50 dark:hover:bg-gray-800",
                            isSubmitting && "cursor-not-allowed opacity-80",
                            displayError && "border-red-400 focus:ring-red-400"
                        )}
                        onKeyDown={handleKeyDown}
                        onCompositionStart={() => {
                            isComposingRef.current = true;
                        }}
                        onCompositionEnd={() => {
                            isComposingRef.current = false;
                        }}
                        onBlur={() => {
                            if (!input) return;
                            const err = validate(input);
                            if (err) setError(err);
                        }}
                        autoFocus
                    />

                    <Plus
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <span
                        className={clsx(
                            "absolute right-3 top-1/2 -translate-y-1/2 text-xs transition",
                            lengthColor
                        )}
                    >
                        {trimmedLength}/{MAX_LENGTH}
                    </span>
                </div>

                <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={!input.trim() || isSubmitting || !!displayError}
                    aria-label="タスク追加"
                    className={clsx(
                        "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white",
                        "px-5 py-2 rounded-lg shadow-sm transition-all",
                        "hover:scale-105 active:scale-95",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    <Plus size={16} />
                    {isSubmitting ? "追加中..." : "追加"}
                </Button>
            </div>

            {displayError && (
                <div
                    className="flex items-center gap-1 text-sm text-red-500"
                    role="alert"
                >
                    <AlertCircle size={14} />
                    {displayError}
                </div>
            )}
        </div>
    );
}