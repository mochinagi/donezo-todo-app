"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import clsx from "clsx";

import {
    Loader2,
    Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";

import { useTodoStore } from "@/store/todoStore";

const MAX_LENGTH = 100;

const MAX_IMPORT = 20;

const STORAGE_KEY =
    "donezo-add-todo-draft";

const STORAGE_TIME_KEY =
    "donezo-add-todo-draft-time";

const DRAFT_EXPIRE =
    1000 * 60 * 60 * 24;

const SUBMIT_COOLDOWN = 250;

type AddTodoProps = {
    input: string;

    setInput: (
        value: string
    ) => void;

    onAdd: (
        text: string
    ) => Promise<void> | void;
};

const normalize = (
    value: string
) => {
    return value
        .replace(/\u3000/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_LENGTH);
};

const parseImportText = (
    value: string
) => {
    return [
        ...new Set(
            value
                .split("\n")
                .map(normalize)
                .filter(Boolean)
        ),
    ].slice(0, MAX_IMPORT);
};

const saveDraft = (
    value: string
) => {
    if (!value.trim()) {
        localStorage.removeItem(
            STORAGE_KEY
        );

        localStorage.removeItem(
            STORAGE_TIME_KEY
        );

        return;
    }

    localStorage.setItem(
        STORAGE_KEY,
        value
    );

    localStorage.setItem(
        STORAGE_TIME_KEY,
        String(Date.now())
    );
};

const clearDraft = () => {
    localStorage.removeItem(
        STORAGE_KEY
    );

    localStorage.removeItem(
        STORAGE_TIME_KEY
    );
};

export default function AddTodo({
    input,
    setInput,
    onAdd,
}: AddTodoProps) {
    const todos = useTodoStore(
        state => state.todos
    );

    const inputRef =
        useRef<HTMLInputElement>(null);

    const composing =
        useRef(false);

    const submitLocked =
        useRef(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [lastAdded, setLastAdded] =
        useState("");

    const normalized =
        useMemo(
            () => normalize(input),
            [input]
        );

    const existingTodos =
        useMemo(() => {
            return new Set(
                todos.map(todo =>
                    todo.normalized.toLowerCase()
                )
            );
        }, [todos]);

    const duplicated =
        existingTodos.has(
            normalized.toLowerCase()
        );

    const remaining =
        MAX_LENGTH -
        normalized.length;

    useEffect(() => {
        if (input) {
            return;
        }

        const draft =
            localStorage.getItem(
                STORAGE_KEY
            );

        const timestamp =
            localStorage.getItem(
                STORAGE_TIME_KEY
            );

        if (!draft || !timestamp) {
            return;
        }

        const expired =
            Date.now() -
            Number(timestamp) >
            DRAFT_EXPIRE;

        if (expired) {
            clearDraft();

            return;
        }

        setInput(draft);
    }, []);

    useEffect(() => {
        saveDraft(input);
    }, [input]);

    const clearInput =
        useCallback(() => {
            setInput("");

            setError("");

            clearDraft();

            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        }, [setInput]);

    const validate =
        useCallback(() => {
            if (!normalized) {
                return "入力してください";
            }

            if (duplicated) {
                return "既に存在します";
            }

            return "";
        }, [
            normalized,
            duplicated,
        ]);

    const handleSubmit =
        useCallback(async () => {
            if (
                submitting ||
                submitLocked.current
            ) {
                return;
            }

            const validation =
                validate();

            if (validation) {
                setError(validation);

                return;
            }

            submitLocked.current =
                true;

            setSubmitting(true);

            try {
                await onAdd(normalized);

                setLastAdded(normalized);

                clearInput();
            } catch {
                setError(
                    "追加できませんでした"
                );
            } finally {
                setSubmitting(false);

                window.setTimeout(() => {
                    submitLocked.current =
                        false;
                }, SUBMIT_COOLDOWN);
            }
        }, [
            submitting,
            validate,
            onAdd,
            normalized,
            clearInput,
        ]);

    const handlePaste =
        useCallback(
            async (
                event: React.ClipboardEvent<HTMLInputElement>
            ) => {
                const text =
                    event.clipboardData.getData(
                        "text"
                    );

                if (
                    !text.includes("\n")
                ) {
                    return;
                }

                event.preventDefault();

                const items =
                    parseImportText(
                        text
                    );

                if (!items.length) {
                    return;
                }

                let added = 0;

                let skipped = 0;

                const existing =
                    new Set(
                        existingTodos
                    );

                for (const item of items) {
                    const key =
                        item.toLowerCase();

                    if (
                        existing.has(key)
                    ) {
                        skipped++;

                        continue;
                    }

                    try {
                        await onAdd(item);

                        existing.add(key);

                        added++;
                    } catch {
                        skipped++;
                    }
                }

                if (added > 0) {
                    toast.success(
                        `${added}件追加しました`
                    );
                }

                if (skipped > 0) {
                    toast.error(
                        `${skipped}件追加できませんでした`
                    );
                }
            },
            [
                existingTodos,
                onAdd,
            ]
        );

    return (
        <div className="border-b border-zinc-200 bg-white px-6 py-5">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Plus
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <Input
                        ref={inputRef}
                        autoFocus
                        autoComplete="off"
                        disabled={submitting}
                        value={input}
                        placeholder="タスクを追加"
                        aria-invalid={
                            !!error
                        }
                        onChange={event => {
                            setInput(
                                event.target.value
                            );

                            if (error) {
                                setError("");
                            }
                        }}
                        onPaste={
                            handlePaste
                        }
                        onCompositionStart={() => {
                            composing.current =
                                true;
                        }}
                        onCompositionEnd={() => {
                            composing.current =
                                false;
                        }}
                        onKeyDown={event => {
                            if (
                                composing.current
                            ) {
                                return;
                            }

                            if (
                                event.key ===
                                "Enter"
                            ) {
                                event.preventDefault();

                                handleSubmit();

                                return;
                            }

                            if (
                                event.key ===
                                "ArrowUp" &&
                                !input &&
                                lastAdded
                            ) {
                                setInput(
                                    lastAdded
                                );

                                return;
                            }

                            if (
                                event.key ===
                                "Escape" &&
                                input
                            ) {
                                clearInput();
                            }
                        }}
                        className={clsx(
                            "h-11 pl-10 pr-20",
                            error &&
                            "border-destructive",
                            duplicated &&
                            !error &&
                            "border-amber-400"
                        )}
                    />

                    <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                        <span
                            className={clsx(
                                "text-xs",
                                remaining <= 10
                                    ? "text-amber-600"
                                    : "text-zinc-400"
                            )}
                        >
                            {
                                normalized.length
                            }
                            /{MAX_LENGTH}
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    disabled={
                        submitting ||
                        !normalized ||
                        duplicated
                    }
                    onClick={
                        handleSubmit
                    }
                    className="min-w-[96px]"
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

            <div className="mt-2 flex min-h-[18px] items-center justify-between text-xs">
                <div className="text-destructive">
                    {error}
                </div>

                <div className="text-zinc-400">
                    Enterで追加
                </div>
            </div>
        </div>
    );
}