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
    const todos = useTodoStore(state => state.todos);

    const inputRef = useRef<HTMLInputElement>(null);

    const composing = useRef(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] = useState("");

    const [lastAdded, setLastAdded] =
        useState("");

    useEffect(() => {
        const saved =
            localStorage.getItem(DRAFT_KEY);

        if (saved && !input) {
            setInput(saved);
        }
    }, []);

    useEffect(() => {
        if (!input.trim()) {
            localStorage.removeItem(DRAFT_KEY);

            return;
        }

        localStorage.setItem(DRAFT_KEY, input);
    }, [input]);

    const normalizedInput = normalize(input);

    const duplicated = todos.some(
        todo =>
            todo.normalized ===
            normalizedInput.toLowerCase()
    );

    const remaining =
        MAX_LENGTH - normalizedInput.length;

    const clear = () => {
        setInput("");
        setError("");

        localStorage.removeItem(DRAFT_KEY);

        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const handleSubmit = async () => {
        if (submitting) {
            return;
        }

        if (!normalizedInput) {
            setError("入力してください");

            return;
        }

        if (duplicated) {
            setError("既に存在します");

            return;
        }

        setSubmitting(true);

        try {
            await onAdd(normalizedInput);

            setLastAdded(normalizedInput);

            clear();
        } catch {
            setError("追加できませんでした");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaste = async (
        e: React.ClipboardEvent<HTMLInputElement>
    ) => {
        const text =
            e.clipboardData.getData("text");

        if (!text.includes("\n")) {
            return;
        }

        e.preventDefault();

        const items = text
            .split("\n")
            .map(normalize)
            .filter(Boolean);

        if (!items.length) {
            return;
        }

        let added = 0;
        let skipped = 0;

        for (const item of items) {
            if (added >= MAX_IMPORT) {
                break;
            }

            const exists = todos.some(
                todo =>
                    todo.normalized ===
                    item.toLowerCase()
            );

            if (exists) {
                skipped++;

                continue;
            }

            try {
                await onAdd(item);

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
                `${skipped}件スキップしました`
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
                        aria-invalid={!!error}
                        onChange={e => {
                            setInput(e.target.value);

                            if (error) {
                                setError("");
                            }
                        }}
                        onPaste={handlePaste}
                        onCompositionStart={() => {
                            composing.current = true;
                        }}
                        onCompositionEnd={() => {
                            composing.current = false;
                        }}
                        onKeyDown={e => {
                            if (
                                composing.current
                            ) {
                                return;
                            }

                            if (
                                e.key === "Enter"
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
                        {duplicated &&
                            !error && (
                                <span className="text-[11px] text-amber-600">
                                    duplicate
                                </span>
                            )}

                        <span
                            className={clsx(
                                "text-xs",
                                remaining <= 10
                                    ? "text-amber-600"
                                    : "text-zinc-400"
                            )}
                        >
                            {
                                normalizedInput.length
                            }
                            /{MAX_LENGTH}
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    disabled={
                        submitting ||
                        !normalizedInput ||
                        duplicated
                    }
                    onClick={handleSubmit}
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

            <div className="mt-2 flex items-center justify-between text-xs">
                <div className="min-h-[16px] text-destructive">
                    {error}
                </div>

                <div className="text-zinc-400">
                    Paste multiple lines to import
                </div>
            </div>
        </div>
    );
}