"use client";

import {
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

const DRAFT_KEY =
    "donezo-add-todo-draft";

const DRAFT_TIME_KEY =
    "donezo-add-todo-draft-time";

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

    const submitLock =
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

    const todoMap = useMemo(() => {
        return new Set(
            todos.map(
                todo => todo.normalized
            )
        );
    }, [todos]);

    const duplicated =
        todoMap.has(
            normalized.toLowerCase()
        );

    const remaining =
        MAX_LENGTH -
        normalized.length;

    useEffect(() => {
        const draft =
            localStorage.getItem(
                DRAFT_KEY
            );

        const timestamp =
            localStorage.getItem(
                DRAFT_TIME_KEY
            );

        if (!draft || input) {
            return;
        }

        const expired =
            !timestamp ||
            now() - Number(timestamp) >
            1000 * 60 * 60 * 24;

        if (expired) {
            localStorage.removeItem(
                DRAFT_KEY
            );

            localStorage.removeItem(
                DRAFT_TIME_KEY
            );

            return;
        }

        setInput(draft);
    }, []);

    useEffect(() => {
        if (!input.trim()) {
            localStorage.removeItem(
                DRAFT_KEY
            );

            localStorage.removeItem(
                DRAFT_TIME_KEY
            );

            return;
        }

        localStorage.setItem(
            DRAFT_KEY,
            input
        );

        localStorage.setItem(
            DRAFT_TIME_KEY,
            String(Date.now())
        );
    }, [input]);

    const clear = () => {
        setInput("");
        setError("");

        localStorage.removeItem(
            DRAFT_KEY
        );

        localStorage.removeItem(
            DRAFT_TIME_KEY
        );

        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const validate = () => {
        if (!normalized) {
            return "入力してください";
        }

        if (duplicated) {
            return "既に存在します";
        }

        return "";
    };

    const handleSubmit =
        async () => {
            if (
                submitting ||
                submitLock.current
            ) {
                return;
            }

            const validation =
                validate();

            if (validation) {
                setError(validation);

                return;
            }

            submitLock.current = true;

            setSubmitting(true);

            try {
                await onAdd(normalized);

                setLastAdded(normalized);

                clear();
            } catch {
                setError(
                    "追加できませんでした"
                );
            } finally {
                setSubmitting(false);

                setTimeout(() => {
                    submitLock.current =
                        false;
                }, SUBMIT_COOLDOWN);
            }
        };

    const handlePaste =
        async (
            e: React.ClipboardEvent<HTMLInputElement>
        ) => {
            const text =
                e.clipboardData.getData(
                    "text"
                );

            if (
                !text.includes("\n")
            ) {
                return;
            }

            e.preventDefault();

            const items =
                parseImportText(text);

            if (!items.length) {
                return;
            }

            let added = 0;
            let skipped = 0;

            const existing =
                new Set(todoMap);

            for (const item of items) {
                const normalizedItem =
                    item.toLowerCase();

                if (
                    existing.has(
                        normalizedItem
                    )
                ) {
                    skipped++;

                    continue;
                }

                try {
                    await onAdd(item);

                    existing.add(
                        normalizedItem
                    );

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
        };

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
                        onChange={e => {
                            setInput(
                                e.target.value
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
                        onKeyDown={e => {
                            if (
                                composing.current
                            ) {
                                return;
                            }

                            if (
                                e.key ===
                                "Enter"
                            ) {
                                e.preventDefault();

                                handleSubmit();
                            }

                            if (
                                e.key ===
                                "ArrowUp" &&
                                !input &&
                                lastAdded
                            ) {
                                setInput(
                                    lastAdded
                                );
                            }

                            if (
                                e.key ===
                                "Escape" &&
                                input
                            ) {
                                clear();
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

function now() {
    return Date.now();
}