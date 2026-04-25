"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { useTodoStore } from "@/store/todoStore";

const MAX_LENGTH = 100;
const MAX_PASTE = 20;

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

    /* ===== normalize ===== */
    const normalize = useCallback((v: string) => {
        return v.replace(/\s+/g, " ").trim();
    }, []);

    /* ===== fast lookup ===== */
    const todoSet = useMemo(() => {
        return new Set(
            todos.map((t) => normalize(t.text).toLowerCase())
        );
    }, [todos, normalize]);

    /* ===== validation ===== */
    const validate = useCallback(
        (value: string) => {
            const v = normalize(value);

            if (!v) return "入力してください";
            if (v.length > MAX_LENGTH) return `最大${MAX_LENGTH}文字`;
            if (todoSet.has(v.toLowerCase())) return "既に存在します";

            return "";
        },
        [todoSet, normalize]
    );

    const error = useMemo(() => {
        if (!touched && !input) return "";
        return validate(input);
    }, [input, touched, validate]);

    const hasError = !!error;
    const length = input.length;

    /* ===== add ===== */
    const handleAdd = useCallback(async () => {
        if (submittingRef.current) return;

        const value = normalize(input);
        const err = validate(value);

        if (err) {
            setTouched(true);
            return;
        }

        try {
            submittingRef.current = true;
            setIsSubmitting(true);

            await onAdd(value);

            toast.success("タスクを追加しました");

            setInput("");
            setTouched(false);

            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        } catch {
            toast.error("追加に失敗しました");
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }, [input, onAdd, setInput, validate, normalize]);

    /* ===== bulk paste (improved) ===== */
    const handlePaste = useCallback(
        async (e: React.ClipboardEvent<HTMLInputElement>) => {
            const text = e.clipboardData.getData("text");

            if (!text.includes("\n")) return;

            e.preventDefault();

            const rawLines = text.split("\n");

            const lines = Array.from(
                new Set(
                    rawLines
                        .map(normalize)
                        .filter(Boolean)
                        .slice(0, MAX_PASTE)
                )
            );

            if (!lines.length) return;

            let success = 0;

            for (const line of lines) {
                const err = validate(line);
                if (err) continue;

                try {
                    await onAdd(line);
                    success++;
                } catch {
                    // ignore single failure
                }
            }

            if (success > 0) {
                toast.success(`${success}件追加しました`);
            } else {
                toast.error("追加できませんでした");
            }
        },
        [normalize, onAdd, validate]
    );

    /* ===== input ===== */
    const handleChange = useCallback(
        (value: string) => {
            setInput(value);
            if (!touched) setTouched(true);
        },
        [setInput, touched]
    );

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
        !input.trim() || isSubmitting || hasError;

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
                                : "タスクを入力（改行で複数追加可）"
                        }
                        maxLength={MAX_LENGTH}
                        disabled={isSubmitting}
                        aria-invalid={hasError}
                        aria-describedby="todo-error"
                        className={clsx(
                            "pl-10 pr-12 rounded-lg",
                            hasError && "border-red-400"
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

            {hasError && (
                <div
                    id="todo-error"
                    role="alert"
                    className="flex items-center gap-1 text-sm text-red-500"
                >
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}
        </div>
    );
}