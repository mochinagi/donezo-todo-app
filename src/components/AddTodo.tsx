"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";
import clsx from "clsx";
import { toast } from "@/components/ui/toaster";
import { useTodoStore } from "@/store/todoStore";

const MAX_LENGTH = 100;
const MAX_PASTE = 20;

type OnAdd = (text: string) => Promise<void> | void;

interface AddTodoProps {
    input: string;
    setInput: (val: string) => void;
    onAdd: OnAdd;
}

const normalize = (v: string) =>
    v.replace(/\u3000/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH);

export default function AddTodo({
    input,
    setInput,
    onAdd,
}: AddTodoProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const isComposingRef = useRef(false);

    const normalizedList = useTodoStore((s) =>
        s.todos.map((t) => t.normalized)
    );

    const existingSet = useMemo(
        () => new Set(normalizedList),
        [normalizedList]
    );

    const normalizedInput = useMemo(
        () => normalize(input),
        [input]
    );

    const validate = useCallback(
        (value: string, set: Set<string>) => {
            if (!value) return "入力してください";
            if (value.length > MAX_LENGTH) return `最大${MAX_LENGTH}文字`;
            if (set.has(value.toLowerCase())) return "既に存在します";
            return "";
        },
        []
    );

    const error = useMemo(() => {
        if (!touched && !input) return "";
        return validate(normalizedInput, existingSet);
    }, [normalizedInput, touched, input, existingSet, validate]);

    const handleAdd = useCallback(async () => {
        if (isSubmitting) return;

        const value = normalizedInput;
        const err = validate(value, existingSet);

        if (err) {
            setTouched(true);
            return;
        }

        setIsSubmitting(true);

        try {
            await onAdd(value);

            setInput("");
            setTouched(false);

            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        } catch {
            toast.error("追加に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    }, [normalizedInput, validate, existingSet, onAdd, setInput, isSubmitting]);

    const handlePaste = useCallback(
        async (e: React.ClipboardEvent<HTMLInputElement>) => {
            const text = e.clipboardData.getData("text");
            if (!text.includes("\n")) return;

            e.preventDefault();

            const lines = text
                .split("\n")
                .map(normalize)
                .filter(Boolean)
                .slice(0, MAX_PASTE);

            const baseSet = new Set(existingSet);

            const tasks = lines.map(async (line) => {
                const lower = line.toLowerCase();

                if (validate(line, baseSet)) {
                    return { ok: false };
                }

                try {
                    await onAdd(line);
                    baseSet.add(lower);
                    return { ok: true };
                } catch {
                    return { ok: false };
                }
            });

            const results = await Promise.all(tasks);

            const success = results.filter(r => r.ok).length;
            const fail = results.length - success;

            if (success) toast.success(`${success}件追加`);
            if (fail) toast.error(`${fail}件失敗`);
        },
        [existingSet, onAdd, validate]
    );

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

    const disabled = isSubmitting || !!error || !normalizedInput;

    return (
        <div className="p-6 border-b space-y-2">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            if (!touched) setTouched(true);
                        }}
                        onBlur={() => setTouched(true)}
                        onPaste={handlePaste}
                        onKeyDown={handleKeyDown}
                        disabled={isSubmitting}
                        aria-invalid={!!error}
                        className={clsx(
                            "pl-10 pr-12 rounded-lg",
                            error && "border-red-400"
                        )}
                        onCompositionStart={() => {
                            isComposingRef.current = true;
                        }}
                        onCompositionEnd={() => {
                            isComposingRef.current = false;
                        }}
                        placeholder="タスクを入力"
                        autoFocus
                    />

                    <Plus
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {input.length}/{MAX_LENGTH}
                    </span>
                </div>

                <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={disabled}
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
                <div
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