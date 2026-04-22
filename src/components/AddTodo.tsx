"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { useTodoStore } from "@/store/todoStore";

const MAX_LENGTH = 100;

type OnAdd = (text: string) => Promise<void> | void;

interface AddTodoProps {
    input: string;
    setInput: (val: string) => void;
    onAdd: OnAdd;
}

export default function AddTodo({
    input,
    setInput,
    onAdd,
}: AddTodoProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const isComposingRef = useRef(false);
    const submittingRef = useRef(false);

    const todos = useTodoStore((s) => s.todos);

    /* ===== fast lookup ===== */
    const todoSet = useMemo(() => {
        return new Set(todos.map((t) => t.text.toLowerCase()));
    }, [todos]);

    /* ===== validation ===== */
    const validate = useCallback(
        (value: string) => {
            const v = value.trim();

            if (!v) return "入力してください";
            if (v.length > MAX_LENGTH) return `最大${MAX_LENGTH}文字`;
            if (todoSet.has(v.toLowerCase())) return "既に存在します";

            return "";
        },
        [todoSet]
    );

    const trimmed = input.trim();
    const length = trimmed.length;

    const error = useMemo(() => {
        if (!touched) return "";
        return validate(input);
    }, [input, touched, validate]);

    /* ===== add ===== */
    const handleAdd = useCallback(async () => {
        if (submittingRef.current) return;

        const v = input.trim();
        const err = validate(input);

        if (err) {
            setTouched(true);
            return;
        }

        try {
            submittingRef.current = true;
            setIsSubmitting(true);

            await onAdd(v);

            toast.success("追加しました");

            setInput("");
            setTouched(false);

            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        } catch {
            toast.error("失敗しました");
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }, [input, onAdd, setInput, validate]);

    /* ===== input ===== */
    const handleChange = useCallback(
        (value: string) => {
            setInput(value);
        },
        [setInput]
    );

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData
            .getData("text")
            .trim()
            .slice(0, MAX_LENGTH);

        setInput(text);
    };

    /* ===== keyboard ===== */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComposingRef.current) return;

        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }

        if (e.key === "Escape") {
            setInput("");
            setTouched(false);
        }
    };

    const lengthColor =
        length > MAX_LENGTH
            ? "text-red-500"
            : length > MAX_LENGTH * 0.8
                ? "text-yellow-500"
                : "text-gray-400";

    const disabled =
        !trimmed || isSubmitting || !!validate(input);

    return (
        <div className="p-6 border-b space-y-2">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => handleChange(e.target.value)}
                        onBlur={() => setTouched(true)}
                        onPaste={handlePaste}
                        placeholder={
                            isSubmitting
                                ? "追加中..."
                                : "タスクを入力"
                        }
                        maxLength={MAX_LENGTH}
                        disabled={isSubmitting}
                        aria-invalid={!!error}
                        className={clsx(
                            "pl-10 pr-12 rounded-lg",
                            error && "border-red-400"
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
                        {length}/{MAX_LENGTH}
                    </span>
                </div>

                <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={disabled}
                    className="flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" size={16} />
                    ) : (
                        <Plus size={16} />
                    )}
                    {isSubmitting ? "追加中" : "追加"}
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}
        </div>
    );
}