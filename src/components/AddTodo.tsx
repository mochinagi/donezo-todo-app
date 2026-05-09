"use client";

import { useEffect, useRef, useState } from "react";

import clsx from "clsx";

import { Loader2, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { toast } from "@/components/ui/toaster";

import { useTodoStore } from "@/store/todoStore";

const MAX_LENGTH = 100;

const MAX_IMPORT = 20;

const DRAFT_KEY = "donezo-add-todo-draft";

type AddTodoProps = {
    input: string;
    setInput: (value: string) => void;
    onAdd: (text: string) => Promise<void> | void;
};

const normalizeInput = (value: string) =>
    value
        .replace(/\u3000/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_LENGTH);

export default function AddTodo({
    input,
    setInput,
    onAdd,
}: AddTodoProps) {
    const todos = useTodoStore((state) => state.todos);

    const inputRef = useRef<HTMLInputElement>(null);

    const composing = useRef(false);

    const lastAdded = useRef("");

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] = useState("");

    const normalizedInput =
        normalizeInput(input);

    useEffect(() => {
        const saved =
            localStorage.getItem(
                DRAFT_KEY
            );

        if (saved && !input) {
            setInput(saved);
        }
    }, []);

    useEffect(() => {
        if (!input.trim()) {
            localStorage.removeItem(
                DRAFT_KEY
            );

            return;
        }

        localStorage.setItem(
            DRAFT_KEY,
            input
        );
    }, [input]);

    useEffect(() => {
        if (!input) {
            setError("");
        }
    }, [input]);

    const validate = (value: string) => {
        if (!value) {
            return "入力してください";
        }

        if (value.length > MAX_LENGTH) {
            return `最大${MAX_LENGTH}文字です`;
        }

        const normalized =
            normalizeInput(value).toLowerCase();

        const exists = todos.some(
            (todo) =>
                todo.normalized === normalized
        );

        if (exists) {
            return "既に存在します";
        }

        return null;
    };

    const clear = () => {
        setInput("");

        setError("");

        localStorage.removeItem(DRAFT_KEY);

        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const submit = async () => {
        if (submitting) {
            return;
        }

        const next = normalizedInput;

        const validationError =
            validate(next);

        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);

        try {
            await onAdd(next);

            lastAdded.current = next;

            clear();
        } catch {
            setError("追加できませんでした");
        } finally {
            setSubmitting(false);
        }
    };

    const importTodos = async (
        event: React.ClipboardEvent<HTMLInputElement>
    ) => {
        const text =
            event.clipboardData.getData(
                "text"
            );

        if (!text.includes("\n")) {
            return;
        }

        event.preventDefault();

        const lines =
            text.split("\n");

        const unique: string[] = [];

        for (const line of lines) {
            const normalized =
                normalizeInput(line);

            if (!normalized) {
                continue;
            }

            if (
                unique.includes(normalized)
            ) {
                continue;
            }

            unique.push(normalized);

            if (
                unique.length >= MAX_IMPORT
            ) {
                break;
            }
        }

        let added = 0;

        for (const line of unique) {
            const validationError =
                validate(line);

            if (validationError) {
                continue;
            }

            try {
                await onAdd(line);

                added += 1;
            } catch {
                continue;
            }
        }

        if (added > 0) {
            toast.success(
                `${added}件追加しました`
            );
        }
    };

    return (
        <div className="border-b border-zinc-200 px-6 py-5">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        autoFocus
                        autoComplete="off"
                        disabled={submitting}
                        value={input}
                        placeholder="タスクを追加"
                        aria-invalid={!!error}
                        onChange={(event) => {
                            setInput(
                                event.target.value
                            );
                        }}
                        onPaste={importTodos}
                        onCompositionStart={() => {
                            composing.current = true;
                        }}
                        onCompositionEnd={() => {
                            composing.current = false;
                        }}
                        onKeyDown={(event) => {
                            if (composing.current) {
                                return;
                            }

                            if (
                                event.key ===
                                "Enter"
                            ) {
                                event.preventDefault();

                                submit();
                            }

                            if (
                                event.key ===
                                "Escape"
                            ) {
                                clear();
                            }

                            if (
                                event.key ===
                                "ArrowUp" &&
                                !input
                            ) {
                                setInput(
                                    lastAdded.current
                                );
                            }

                            if (
                                (event.metaKey ||
                                    event.ctrlKey) &&
                                event.key ===
                                "Enter"
                            ) {
                                submit();
                            }
                        }}
                        className={clsx(
                            "h-11 pl-10 pr-16",
                            error &&
                            "border-destructive"
                        )}
                    />

                    <Plus
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                        <span className="text-[11px] text-zinc-400">
                            Enter
                        </span>

                        <span className="text-xs text-zinc-400">
                            {
                                normalizedInput.length
                            }
                            /
                            {MAX_LENGTH}
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    disabled={
                        submitting ||
                        !normalizedInput
                    }
                    onClick={submit}
                    className="min-w-[92px]"
                >
                    {submitting ? (
                        <Loader2
                            size={16}
                            className="animate-spin"
                        />
                    ) : (
                        <Plus size={16} />
                    )}

                    {submitting
                        ? "追加中"
                        : "追加"}
                </Button>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
                <div className="text-destructive">
                    {error}
                </div>

                <div className="text-zinc-400">
                    Esc to clear
                </div>
            </div>
        </div>
    );
}