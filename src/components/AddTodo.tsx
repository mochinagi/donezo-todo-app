"use client";

import {
    useState,
    useRef,
    useEffect,
} from "react";

import clsx from "clsx";

import {
    Plus,
    Loader2,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { toast } from "@/components/ui/toaster";

import { useTodoStore } from "@/store/todoStore";

const MAX_LENGTH = 100;

const MAX_PASTE = 20;

type AddTodoProps = {
    input: string;

    setInput: (
        value: string
    ) => void;

    onAdd: (
        text: string
    ) => Promise<void> | void;
};

const normalize = (value: string) => {
    return value
        .replace(/\u3000/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_LENGTH);
};

export default function AddTodo({
    input,
    setInput,
    onAdd,
}: AddTodoProps) {
    const todos = useTodoStore(
        (state) => state.todos
    );

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const inputRef =
        useRef<HTMLInputElement>(null);

    const composingRef =
        useRef(false);

    const normalizedInput =
        normalize(input);

    useEffect(() => {
        if (!input.trim()) {
            setError("");
        }
    }, [input]);

    const validate = (
        value: string
    ) => {
        if (!value) {
            return "入力してください";
        }

        if (
            value.length >
            MAX_LENGTH
        ) {
            return `最大${MAX_LENGTH}文字です`;
        }

        const duplicated =
            todos.some(
                (todo) =>
                    todo.normalized ===
                    value.toLowerCase()
            );

        if (duplicated) {
            return "既に存在します";
        }

        return "";
    };

    const handleSubmit =
        async () => {
            if (submitting) {
                return;
            }

            const next =
                normalizedInput;

            const validationError =
                validate(next);

            if (
                validationError
            ) {
                setError(
                    validationError
                );

                return;
            }

            setSubmitting(true);

            try {
                await onAdd(next);

                setInput("");

                setError("");

                requestAnimationFrame(
                    () => {
                        inputRef.current?.focus();
                    }
                );
            } catch {
                setError(
                    "追加に失敗しました"
                );
            } finally {
                setSubmitting(false);
            }
        };

    const handlePaste =
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

            const lines = text
                .split("\n")
                .map(normalize)
                .filter(Boolean)
                .slice(
                    0,
                    MAX_PASTE
                );

            let added = 0;

            for (const line of lines) {
                const validationError =
                    validate(line);

                if (
                    validationError
                ) {
                    continue;
                }

                try {
                    await onAdd(
                        line
                    );

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

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (
            composingRef.current
        ) {
            return;
        }

        if (
            event.key === "Enter"
        ) {
            event.preventDefault();

            handleSubmit();
        }

        if (
            event.key === "Escape"
        ) {
            setInput("");

            setError("");
        }
    };

    const disabled =
        submitting ||
        !normalizedInput;

    return (
        <div className="border-b px-6 py-5">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        value={input}
                        disabled={
                            submitting
                        }
                        autoFocus
                        autoComplete="off"
                        placeholder="タスクを追加"
                        aria-invalid={
                            !!error
                        }
                        onChange={(e) => {
                            setInput(
                                e.target
                                    .value
                            );
                        }}
                        onKeyDown={
                            handleKeyDown
                        }
                        onPaste={
                            handlePaste
                        }
                        onCompositionStart={() => {
                            composingRef.current =
                                true;
                        }}
                        onCompositionEnd={() => {
                            composingRef.current =
                                false;
                        }}
                        className={clsx(
                            "pl-9 pr-14",
                            error &&
                            "border-destructive"
                        )}
                    />

                    <Plus
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {
                            normalizedInput.length
                        }
                        /
                        {
                            MAX_LENGTH
                        }
                    </div>
                </div>

                <Button
                    type="button"
                    disabled={
                        disabled
                    }
                    onClick={
                        handleSubmit
                    }
                >
                    {submitting ? (
                        <Loader2
                            size={16}
                            className="animate-spin"
                        />
                    ) : (
                        <Plus
                            size={16}
                        />
                    )}

                    {submitting
                        ? "追加中"
                        : "追加"}
                </Button>
            </div>

            {error ? (
                <p className="mt-2 text-sm text-destructive">
                    {error}
                </p>
            ) : null}
        </div>
    );
}