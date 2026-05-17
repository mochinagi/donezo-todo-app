"use client";

import {
    useEffect,
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

import { useTodoStore } from "@/store/todoStore";

const MAX_LENGTH = 100;

const MAX_IMPORT = 20;

const STORAGE_KEY =
    "donezo-add-todo-draft";

const STORAGE_TIME_KEY =
    "donezo-add-todo-draft-time";

const DRAFT_EXPIRE =
    1000 * 60 * 60 * 24;

type AddTodoProps = {
    onAdd: (
        text: string
    ) => Promise<void> | void;
};

const normalize = (
    value: string
) =>
    value
        .replace(/\u3000/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_LENGTH);

export default function AddTodo({
    onAdd,
}: AddTodoProps) {
    const todos = useTodoStore(
        s => s.todos
    );

    const inputRef =
        useRef<HTMLInputElement>(
            null
        );

    const composing =
        useRef(false);

    const locked =
        useRef(false);

    const [value, setValue] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [lastAdded, setLastAdded] =
        useState("");

    const normalized =
        normalize(value);

    const duplicated =
        todos.some(
            todo =>
                todo.normalized ===
                normalized.toLowerCase()
        );

    const remaining =
        MAX_LENGTH -
        normalized.length;

    useEffect(() => {
        const draft =
            localStorage.getItem(
                STORAGE_KEY
            );

        const timestamp =
            localStorage.getItem(
                STORAGE_TIME_KEY
            );

        if (
            !draft ||
            !timestamp
        ) {
            return;
        }

        const expired =
            Date.now() -
            Number(timestamp) >
            DRAFT_EXPIRE;

        if (expired) {
            localStorage.removeItem(
                STORAGE_KEY
            );

            localStorage.removeItem(
                STORAGE_TIME_KEY
            );

            return;
        }

        setValue(draft);
    }, []);

    useEffect(() => {
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
    }, [value]);

    const clearInput = () => {
        setValue("");
        setError("");

        localStorage.removeItem(
            STORAGE_KEY
        );

        localStorage.removeItem(
            STORAGE_TIME_KEY
        );

        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const submit = async () => {
        if (
            submitting ||
            locked.current
        ) {
            return;
        }

        if (!normalized) {
            setError(
                "入力してください"
            );

            return;
        }

        if (duplicated) {
            setError(
                "既に存在します"
            );

            return;
        }

        locked.current = true;

        setSubmitting(true);

        try {
            await onAdd(
                normalized
            );

            setLastAdded(
                normalized
            );

            clearInput();
        } catch {
            setError(
                "追加できませんでした"
            );
        } finally {
            setSubmitting(false);

            setTimeout(() => {
                locked.current =
                    false;
            }, 250);
        }
    };

    const handlePaste = async (
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

        const items = [
            ...new Set(
                text
                    .split("\n")
                    .map(normalize)
                    .filter(Boolean)
            ),
        ].slice(0, MAX_IMPORT);

        if (!items.length) {
            return;
        }

        const existing =
            new Set(
                todos.map(todo =>
                    todo.normalized.toLowerCase()
                )
            );

        let added = 0;

        for (const item of items) {
            const key =
                item.toLowerCase();

            if (
                existing.has(key)
            ) {
                continue;
            }

            try {
                await onAdd(item);

                existing.add(key);

                added++;
            } catch {
                //
            }
        }

        if (added > 0) {
            setValue("");
            setError("");
        }
    };

    return (
        <div className="border-b bg-background px-6 py-5">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Plus
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />

                    <Input
                        ref={inputRef}
                        autoFocus
                        autoComplete="off"
                        disabled={
                            submitting
                        }
                        value={value}
                        placeholder="Add task"
                        aria-invalid={
                            !!error
                        }
                        onChange={e => {
                            setValue(
                                e.target
                                    .value
                            );

                            if (error) {
                                setError(
                                    ""
                                );
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
                                (e.metaKey ||
                                    e.ctrlKey) &&
                                e.key ===
                                "Enter"
                            ) {
                                e.preventDefault();

                                submit();

                                return;
                            }

                            if (
                                e.key ===
                                "Enter"
                            ) {
                                e.preventDefault();

                                submit();

                                return;
                            }

                            if (
                                e.key ===
                                "ArrowUp" &&
                                !value &&
                                lastAdded
                            ) {
                                setValue(
                                    lastAdded
                                );

                                return;
                            }

                            if (
                                e.key ===
                                "Escape" &&
                                value
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
                            "border-amber-500"
                        )}
                    />

                    <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                        <span
                            className={clsx(
                                "text-xs",

                                remaining <=
                                    10
                                    ? "text-amber-600"
                                    : "text-muted-foreground"
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
                    onClick={submit}
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
                        ? "Adding"
                        : "Add"}
                </Button>
            </div>

            <div className="mt-2 flex min-h-[18px] items-center justify-between text-xs">
                <div className="text-destructive">
                    {error}
                </div>

                <div className="text-muted-foreground">
                    Enter to submit
                </div>
            </div>
        </div>
    );
}