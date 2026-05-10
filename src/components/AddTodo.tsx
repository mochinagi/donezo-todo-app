"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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

const normalize = (v: string) =>
    v.replace(/\u3000/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_LENGTH);

export default function AddTodo({
    input,
    setInput,
    onAdd,
}: AddTodoProps) {
    const todos = useTodoStore((s) => s.todos);

    const inputRef = useRef<HTMLInputElement>(null);
    const composing = useRef(false);
    const lastAdded = useRef("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const normalizedInput = useMemo(() => normalize(input), [input]);

    const existingSet = useMemo(() => {
        return new Set(todos.map((t) => t.normalized));
    }, [todos]);

    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved && !input) setInput(saved);
    }, []);

    useEffect(() => {
        if (!input.trim()) {
            localStorage.removeItem(DRAFT_KEY);
            return;
        }

        localStorage.setItem(DRAFT_KEY, input);
    }, [input]);

    useEffect(() => {
        if (!input) setError("");
    }, [input]);

    const validate = (value: string) => {
        if (!value) return "入力してください";
        if (value.length > MAX_LENGTH) return `最大${MAX_LENGTH}文字です`;

        const n = normalize(value).toLowerCase();
        if (existingSet.has(n)) return "既に存在します";

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

    const handleSubmit = async () => {
        if (submitting) return;

        const value = normalizedInput;
        const err = validate(value);

        if (err) {
            setError(err);
            return;
        }

        setSubmitting(true);

        try {
            await onAdd(value);
            lastAdded.current = value;
            clear();
        } catch {
            setError("追加できませんでした");
        } finally {
            setSubmitting(false);
        }
    };

    const parseClipboard = (text: string) => {
        return text
            .split("\n")
            .map(normalize)
            .filter(Boolean);
    };

    const bulkAdd = async (items: string[]) => {
        let added = 0;

        for (const item of items) {
            if (added >= MAX_IMPORT) break;
            if (validate(item)) continue;

            try {
                await onAdd(item);
                added++;
            } catch { }
        }

        return added;
    };

    const handlePaste = async (
        e: React.ClipboardEvent<HTMLInputElement>
    ) => {
        const text = e.clipboardData.getData("text");

        if (!text.includes("\n")) return;

        e.preventDefault();

        const items = parseClipboard(text);

        const added = await bulkAdd(items);

        if (added > 0) {
            toast.success(`${added}件追加しました`);
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
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        onCompositionStart={() => {
                            composing.current = true;
                        }}
                        onCompositionEnd={() => {
                            composing.current = false;
                        }}
                        onKeyDown={(e) => {
                            if (composing.current) return;

                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSubmit();
                            }

                            if (e.key === "Escape") {
                                clear();
                            }

                            if (e.key === "ArrowUp" && !input) {
                                setInput(lastAdded.current);
                            }

                            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                handleSubmit();
                            }
                        }}
                        className={clsx(
                            "h-11 pl-10 pr-16",
                            error && "border-destructive"
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
                            {normalizedInput.length}/{MAX_LENGTH}
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    disabled={submitting || !normalizedInput}
                    onClick={handleSubmit}
                    className="min-w-[92px]"
                >
                    {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Plus size={16} />
                    )}
                    {submitting ? "追加中" : "追加"}
                </Button>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
                <div className="text-destructive">{error}</div>
                <div className="text-zinc-400">Esc to clear</div>
            </div>
        </div>
    );
}