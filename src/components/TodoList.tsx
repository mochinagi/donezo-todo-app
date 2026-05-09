"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

import {
    Trash2,
    CheckCircle2,
    GripVertical,
    Pin,
} from "lucide-react";

import {
    useTodoStore,
    useFilteredTodos,
    Todo,
} from "@/store/todoStore";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const TodoInput = memo(function TodoInput() {
    const addTodo = useTodoStore((s) => s.addTodo);

    const [value, setValue] = useState("");

    const submit = useCallback(() => {
        const next = value.trim();

        if (!next) return;

        addTodo(next);

        setValue("");
    }, [value, addTodo]);

    return (
        <div className="flex gap-2">
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") submit();

                    if (e.key === "Escape") {
                        setValue("");
                    }
                }}
                placeholder="Add task"
                className="flex-1 rounded-md border bg-background px-3 py-2 outline-none transition"
            />

            <button
                onClick={submit}
                disabled={!value.trim()}
                className="rounded-md border px-4 text-sm transition disabled:opacity-40"
            >
                Add
            </button>
        </div>
    );
});

type TodoItemProps = {
    todo: Todo;
};

const TodoItem = memo(function TodoItem({ todo }: TodoItemProps) {
    const toggleTodo = useTodoStore((s) => s.toggleTodo);

    const deleteTodo = useTodoStore((s) => s.deleteTodo);

    const togglePinned = useTodoStore((s) => s.togglePinned);

    const updateTodoText = useTodoStore(
        (s) => s.updateTodoText
    );

    const [editing, setEditing] = useState(false);

    const [value, setValue] = useState(todo.text);

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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const save = () => {
        const next = value.trim();

        if (!next) {
            setValue(todo.text);
            setEditing(false);
            return;
        }

        if (next !== todo.text) {
            updateTodoText(todo.id, next);
        }

        setEditing(false);
    };

    const overdue =
        todo.dueDate &&
        !todo.completed &&
        todo.dueDate < Date.now();

    return (
        <div ref={setNodeRef} style={style}>
            <Card className={isDragging ? "opacity-60" : ""}>
                <CardContent className="flex items-center gap-3 p-4">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-muted-foreground"
                    >
                        <GripVertical size={18} />
                    </button>

                    <button
                        onClick={() => toggleTodo(todo.id)}
                        className={
                            todo.completed
                                ? "text-green-600"
                                : "text-muted-foreground"
                        }
                    >
                        <CheckCircle2 size={18} />
                    </button>

                    {editing ? (
                        <input
                            autoFocus
                            value={value}
                            onChange={(e) =>
                                setValue(e.target.value)
                            }
                            onBlur={save}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    save();
                                }

                                if (e.key === "Escape") {
                                    setEditing(false);
                                    setValue(todo.text);
                                }
                            }}
                            className="flex-1 border-b bg-transparent outline-none"
                        />
                    ) : (
                        <button
                            onDoubleClick={() =>
                                setEditing(true)
                            }
                            className={`flex-1 text-left ${todo.completed
                                ? "line-through text-muted-foreground"
                                : ""
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span>{todo.text}</span>

                                {overdue ? (
                                    <span className="text-xs text-red-500">
                                        overdue
                                    </span>
                                ) : null}
                            </div>
                        </button>
                    )}

                    <button
                        onClick={() =>
                            togglePinned(todo.id)
                        }
                        className={
                            todo.pinned
                                ? "text-foreground"
                                : "text-muted-foreground"
                        }
                    >
                        <Pin size={16} />
                    </button>

                    <button
                        onClick={() =>
                            deleteTodo(todo.id)
                        }
                        className="text-muted-foreground transition hover:text-red-500"
                    >
                        <Trash2 size={18} />
                    </button>
                </CardContent>
            </Card>
        </div>
    );
});

export default function TodoList() {
    const todos = useFilteredTodos();

    const reorderTodos = useTodoStore(
        (s) => s.reorderTodos
    );

    const clearCompleted = useTodoStore(
        (s) => s.clearCompleted
    );

    const undo = useTodoStore((s) => s.undo);

    const redo = useTodoStore((s) => s.redo);

    const completed = useTodoStore(
        (s) => s.completed
    );

    const total = useTodoStore((s) => s.total);

    const search = useTodoStore((s) => s.search);

    const setSearch = useTodoStore(
        (s) => s.setSearch
    );

    const activeCategory = useTodoStore(
        (s) => s.activeCategory
    );

    const setActiveCategory = useTodoStore(
        (s) => s.setActiveCategory
    );

    const searchRef = useRef<HTMLInputElement>(null);

    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 6,
            },
        }),
        useSensor(KeyboardSensor)
    );

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            if (
                (e.metaKey || e.ctrlKey) &&
                key === "z"
            ) {
                e.preventDefault();
                undo();
            }

            if (
                (e.metaKey || e.ctrlKey) &&
                key === "y"
            ) {
                e.preventDefault();
                redo();
            }

            if (key === "/") {
                e.preventDefault();
                searchRef.current?.focus();
            }

            if (key === "escape") {
                setSearch("");
            }

            if (
                (e.metaKey || e.ctrlKey) &&
                e.shiftKey &&
                key === "backspace"
            ) {
                clearCompleted();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener(
                "keydown",
                onKeyDown
            );
        };
    }, [undo, redo, clearCompleted, setSearch]);

    const activeTodo = useMemo(() => {
        if (!activeId) return null;

        return todos.find(
            (todo) => todo.id === activeId
        );
    }, [activeId, todos]);

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveId(null);

        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = todos.findIndex(
            (todo) => todo.id === active.id
        );

        const newIndex = todos.findIndex(
            (todo) => todo.id === over.id
        );

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        reorderTodos(oldIndex, newIndex);
    };

    const remainingCount = total - completed;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="mx-auto max-w-2xl space-y-4 p-6">
                <TodoInput />

                <input
                    ref={searchRef}
                    placeholder="Search tasks"
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 outline-none"
                />

                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        {remainingCount} left
                    </span>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={undo}
                            className="transition hover:opacity-70"
                        >
                            Undo
                        </button>

                        <button
                            onClick={redo}
                            className="transition hover:opacity-70"
                        >
                            Redo
                        </button>

                        <button
                            onClick={clearCompleted}
                            className="transition hover:opacity-70"
                        >
                            Clear completed
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 text-sm">
                    {[
                        "tasks",
                        "active",
                        "completed",
                        "archived",
                    ].map((value) => (
                        <button
                            key={value}
                            onClick={() =>
                                setActiveCategory(
                                    value as any
                                )
                            }
                            className={
                                activeCategory === value
                                    ? "font-medium"
                                    : "text-muted-foreground"
                            }
                        >
                            {value}
                        </button>
                    ))}
                </div>

                <SortableContext
                    items={todos.map((todo) => todo.id)}
                    strategy={
                        verticalListSortingStrategy
                    }
                >
                    {todos.length === 0 ? (
                        <div className="rounded-md border py-10 text-center text-sm text-muted-foreground">
                            No tasks found
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todos.map((todo) => (
                                <TodoItem
                                    key={todo.id}
                                    todo={todo}
                                />
                            ))}
                        </div>
                    )}
                </SortableContext>
            </div>

            <DragOverlay>
                {activeTodo ? (
                    <Card className="border shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <GripVertical size={16} />
                                {activeTodo.text}
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}