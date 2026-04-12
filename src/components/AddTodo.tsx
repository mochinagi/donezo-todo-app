"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";
import clsx from "clsx";
import { toast } from "sonner";

interface AddTodoProps {
    input: string;
    setInput: (val: string) => void;
    onAdd: () => Promise<void> | void;
}

export default function AddTodo({ input, setInput, onAdd }: AddTodoProps) {
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const MAX_LENGTH = 100;

    /* -----------------------------
       校验
    ----------------------------- */
    const validate = useCallback((value: string) => {
        const trimmed = value.trim();

        if (!trimmed) return "タスク内容を入力してください";
        if (trimmed.length > MAX_LENGTH)
            return `タスクは${MAX_LENGTH}文字以内で入力してください`;

        return "";
    }, []);

    /* -----------------------------
       实时校验
    ----------------------------- */
    const liveError = useMemo(() => {
        if (!input) return "";
        return validate(input);
    }, [input, validate]);

    const displayError = error || liveError;

    /* -----------------------------
       提交
    ----------------------------- */
    const handleAdd = useCallback(async () => {
        if (isSubmitting) return;

        const err = validate(input);
        if (err) {
            setError(err);
            return;
        }

        try {
            setIsSubmitting(true);

            await onAdd();

            toast.success("タスクを追加しました");

            setInput("");
            setError("");

            inputRef.current?.focus();
        } catch {
            toast.error("タスクの追加に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    }, [input, onAdd, setInput, validate, isSubmitting]);

    /* -----------------------------
       输入变化
    ----------------------------- */
    const handleChange = (value: string) => {
        setInput(value);
        if (error) setError("");
    };

    const trimmedLength = input.trim().length;

    return (
        <div className="p-6 bg-white border-b border-gray-200 space-y-2">
            <div className="flex gap-3">
                <div className="relative flex-1">

                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder="やることを入力して Enter..."
                        aria-label="タスク入力欄"
                        aria-describedby={displayError ? "todo-error" : undefined}
                        aria-invalid={!!displayError}
                        maxLength={MAX_LENGTH}
                        disabled={isSubmitting}
                        className="pl-10 pr-12 focus:ring-2 focus:ring-blue-400 transition rounded-md"
                        onKeyDown={(e) => {
                            if (
                                e.key === "Enter" &&
                                !e.nativeEvent.isComposing
                            ) {
                                handleAdd();
                            }
                            if (e.key === "Escape") {
                                setInput("");
                                setError("");
                            }
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

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {trimmedLength}/{MAX_LENGTH}
                    </span>
                </div>

                <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={!input.trim() || isSubmitting || !!liveError}
                    aria-label="タスク追加"
                    className={clsx(
                        "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2 text-white rounded-md shadow-sm transition",
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
                    id="todo-error"
                    className="flex items-center gap-1 text-sm text-red-500 transition-opacity duration-200"
                    role="alert"
                    aria-live="assertive"
                >
                    <AlertCircle size={14} />
                    {displayError}
                </div>
            )}
        </div>
    );
}