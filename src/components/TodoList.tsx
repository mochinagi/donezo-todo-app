"use client";

import {
    memo,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import {
    Trash2,
    CheckCircle2,
    GripVertical,
    Pin,
} from "lucide-react";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragEndEvent,
} from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
    Todo,
    useFilteredTodos,
    useTodoStats,
    useTodoStore,
} from "@/store/todoStore";

const categories = [
    "tasks",
    "active",
    "completed",
    "archived",
] as const;

const TodoInput = memo(function TodoInput() {
    const addTodo = useTodoStore(
        s => s.addTodo
    );

    const [value, setValue] =
        useState("");

    const submit = () => {
        const text = value.trim();

        if (!text) {
            return;
        }

        addTodo(text);
        setValue("");
    };

    return (
        <div className="flex gap-2">
            <input
                value={value}
                onChange={e =>
                    setValue(e.target.value)
                }
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        submit();
                    }

                    if (e.key === "Escape") {
                        setValue("");
                    }
                }}
                placeholder="Add task"
                className="flex-1 rounded-md border bg-background px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
            />

            <button
                onClick={submit}
                disabled={!value.trim()}
                className="rounded-md border px-4 text-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
                Add
            </button>
        </div>
    );
});

type TodoItemProps = {
    todo: Todo;
    selected: boolean;
    toggleSelect: (
        id: string
    ) => void;
};

const TodoItem = memo(
    function TodoItem({
        todo,
        selected,
        toggleSelect,
    }: TodoItemProps) {
        const toggleTodo =
            useTodoStore(
                s => s.toggleTodo
            );

        const deleteTodo =
            useTodoStore(
                s => s.deleteTodo
            );

        const togglePinned =
            useTodoStore(
                s => s.togglePinned
            );

        const updateTodoText =
            useTodoStore(
                s => s.updateTodoText
            );

        const [editing, setEditing] =
            useState(false);

        const [value, setValue] =
            useState(todo.text);

        useEffect(() => {
            setValue(todo.text);
        }, [todo.text]);

        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({
            id: todo.id,
            disabled: editing,
        });

        const overdue =
            !!todo.dueDate &&
            !todo.completed &&
            todo.dueDate < Date.now();

        const save = () => {
            const text =
                value.trim();

            if (!text) {
                setValue(todo.text);
                setEditing(false);
                return;
            }

            if (text !== todo.text) {
                updateTodoText(
                    todo.id,
                    text
                );
            }

            setEditing(false);
        };

        return (
            <div
                ref={setNodeRef}
                style={{
                    transform:
                        CSS.Transform.toString(
                            transform
                        ),
                    transition,
                }}
            >
                <Card
                    className={
                        isDragging
                            ? "opacity-50"
                            : ""
                    }
                >
                    <CardContent className="flex items-center gap-3 p-4">
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                                toggleSelect(
                                    todo.id
                                )
                            }
                        />

                        <button
                            {...attributes}
                            {...listeners}
                            className="cursor-grab text-muted-foreground"
                        >
                            <GripVertical size={18} />
                        </button>

                        <button
                            onClick={() =>
                                toggleTodo(
                                    todo.id
                                )
                            }
                        >
                            <CheckCircle2
                                size={18}
                                className={
                                    todo.completed
                                        ? "text-green-600"
                                        : "text-muted-foreground"
                                }
                            />
                        </button>

                        {editing ? (
                            <input
                                autoFocus
                                value={value}
                                onChange={e =>
                                    setValue(
                                        e.target
                                            .value
                                    )
                                }
                                onBlur={save}
                                onKeyDown={e => {
                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {
                                        save();
                                    }

                                    if (
                                        e.key ===
                                        "Escape"
                                    ) {
                                        setEditing(
                                            false
                                        );

                                        setValue(
                                            todo.text
                                        );
                                    }
                                }}
                                className="flex-1 border-b bg-transparent outline-none"
                            />
                        ) : (
                            <button
                                onDoubleClick={() =>
                                    setEditing(
                                        true
                                    )
                                }
                                className={`flex-1 text-left ${todo.completed
                                    ? "line-through text-muted-foreground"
                                    : ""
                                    }`}
                            >
                                {todo.text}

                                {overdue && (
                                    <span className="ml-2 text-xs text-red-500">
                                        overdue
                                    </span>
                                )}
                            </button>
                        )}

                        <button
                            onClick={() =>
                                togglePinned(
                                    todo.id
                                )
                            }
                        >
                            <Pin
                                size={16}
                                className={
                                    todo.pinned
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                }
                            />
                        </button>

                        <button
                            onClick={() =>
                                deleteTodo(
                                    todo.id
                                )
                            }
                            className="text-muted-foreground transition hover:text-red-500"
                        >
                            <Trash2 size={18} />
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }
);

export default function TodoList() {
    const todos =
        useFilteredTodos();

    const stats =
        useTodoStats();

    const reorderTodos =
        useTodoStore(
            s => s.reorderTodos
        );

    const clearCompleted =
        useTodoStore(
            s => s.clearCompleted
        );

    const archiveMany =
        useTodoStore(
            s => s.archiveMany
        );

    const undo =
        useTodoStore(
            s => s.undo
        );

    const redo =
        useTodoStore(
            s => s.redo
        );

    const search =
        useTodoStore(
            s => s.search
        );

    const setSearch =
        useTodoStore(
            s => s.setSearch
        );

    const activeCategory =
        useTodoStore(
            s => s.activeCategory
        );

    const setActiveCategory =
        useTodoStore(
            s =>
                s.setActiveCategory
        );

    const searchRef =
        useRef<HTMLInputElement>(
            null
        );

    const [activeId, setActiveId] =
        useState<string | null>(
            null
        );

    const [selectedIds, setSelectedIds] =
        useState<string[]>([]);

    const sensors = useSensors(
        useSensor(
            PointerSensor,
            {
                activationConstraint:
                {
                    distance: 6,
                },
            }
        ),

        useSensor(
            KeyboardSensor
        )
    );

    useEffect(() => {
        const handler = (
            e: KeyboardEvent
        ) => {
            const key =
                e.key.toLowerCase();

            if (
                (e.metaKey ||
                    e.ctrlKey) &&
                key === "z"
            ) {
                e.preventDefault();
                undo();
            }

            if (
                (e.metaKey ||
                    e.ctrlKey) &&
                key === "y"
            ) {
                e.preventDefault();
                redo();
            }

            if (key === "/") {
                e.preventDefault();
                searchRef.current?.focus();
            }

            if (
                key === "escape"
            ) {
                setSearch("");
            }
        };

        window.addEventListener(
            "keydown",
            handler
        );

        return () =>
            window.removeEventListener(
                "keydown",
                handler
            );
    }, [
        undo,
        redo,
        setSearch,
    ]);

    const activeTodo =
        todos.find(
            t => t.id === activeId
        ) ?? null;

    const toggleSelect = (
        id: string
    ) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(
                    v => v !== id
                )
                : [...prev, id]
        );
    };

    const onDragEnd = (
        e: DragEndEvent
    ) => {
        setActiveId(null);

        const { active, over } =
            e;

        if (
            !over ||
            active.id === over.id
        ) {
            return;
        }

        reorderTodos(
            active.id as string,
            over.id as string
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={
                closestCenter
            }
            onDragStart={e =>
                setActiveId(
                    e.active.id as string
                )
            }
            onDragEnd={onDragEnd}
        >
            <div className="mx-auto max-w-2xl space-y-4 p-6">
                <TodoInput />

                <input
                    ref={searchRef}
                    value={search}
                    onChange={e =>
                        setSearch(
                            e.target.value
                        )
                    }
                    placeholder="Search tasks"
                    className="w-full rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
                />

                <div className="flex items-center justify-between text-sm">
                    <span>
                        {stats.active} active
                    </span>

                    <div className="flex gap-3">
                        <button
                            onClick={undo}
                            className="text-muted-foreground transition hover:text-foreground"
                        >
                            Undo
                        </button>

                        <button
                            onClick={redo}
                            className="text-muted-foreground transition hover:text-foreground"
                        >
                            Redo
                        </button>

                        <button
                            onClick={
                                clearCompleted
                            }
                            className="text-muted-foreground transition hover:text-red-500"
                        >
                            Clear completed
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 text-sm">
                    {categories.map(
                        category => (
                            <button
                                key={
                                    category
                                }
                                onClick={() =>
                                    setActiveCategory(
                                        category
                                    )
                                }
                                className={`rounded-md px-2 py-1 transition ${activeCategory ===
                                    category
                                    ? "bg-foreground text-background"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {
                                    category
                                }
                            </button>
                        )
                    )}
                </div>

                {selectedIds.length >
                    0 && (
                        <div className="flex items-center gap-3 rounded-md border p-3 text-sm">
                            <span>
                                {
                                    selectedIds.length
                                }{" "}
                                selected
                            </span>

                            <button
                                onClick={() => {
                                    archiveMany(
                                        selectedIds,
                                        true
                                    );

                                    setSelectedIds(
                                        []
                                    );
                                }}
                                className="text-muted-foreground transition hover:text-foreground"
                            >
                                Archive
                            </button>
                        </div>
                    )}

                <SortableContext
                    items={todos.map(
                        t => t.id
                    )}
                    strategy={
                        verticalListSortingStrategy
                    }
                >
                    {todos.length ===
                        0 ? (
                        <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
                            Nothing here yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todos.map(
                                todo => (
                                    <TodoItem
                                        key={
                                            todo.id
                                        }
                                        todo={
                                            todo
                                        }
                                        selected={selectedIds.includes(
                                            todo.id
                                        )}
                                        toggleSelect={
                                            toggleSelect
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </SortableContext>
            </div>

            <DragOverlay>
                {activeTodo && (
                    <Card className="shadow-lg">
                        <CardContent className="p-4">
                            {
                                activeTodo.text
                            }
                        </CardContent>
                    </Card>
                )}
            </DragOverlay>
        </DndContext>
    );
}