"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Trash2, CheckCircle2, GripVertical, Pin } from "lucide-react";

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

/* ---------------- Todo Input ---------------- */

const TodoInput = memo(function TodoInput() {
    const addTodo = useTodoStore((s) => s.addTodo);
    const [value, setValue] = useState("");

    const submit = useCallback(() => {
        const v = value.trim();
        if (!v) return;

        addTodo(v);
        setValue("");
    }, [value, addTodo]);

    return (
        <div className="flex gap-2">
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                    if (e.key === "Escape") setValue("");
                }}
                placeholder="Add task"
                className="flex-1 rounded-md border bg-background px-3 py-2 outline-none"
            />

            <button
                onClick={submit}
                disabled={!value.trim()}
                className="rounded-md border px-4 text-sm disabled:opacity-40"
            >
                Add
            </button>
        </div>
    );
});

/* ---------------- Todo Item ---------------- */

type TodoItemProps = { todo: Todo };

const TodoItem = memo(function TodoItem({ todo }: TodoItemProps) {
    const toggleTodo = useTodoStore((s) => s.toggleTodo);
    const deleteTodo = useTodoStore((s) => s.deleteTodo);
    const togglePinned = useTodoStore((s) => s.togglePinned);
    const updateTodoText = useTodoStore((s) => s.updateTodoText);

    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(todo.text);

    useEffect(() => setValue(todo.text), [todo.text]);

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

    const overdue = useMemo(() => {
        return !!(
            todo.dueDate &&
            !todo.completed &&
            todo.dueDate < Date.now()
        );
    }, [todo.dueDate, todo.completed]);

    const save = () => {
        const v = value.trim();

        if (!v) {
            setValue(todo.text);
            setEditing(false);
            return;
        }

        if (v !== todo.text) {
            updateTodoText(todo.id, v);
        }

        setEditing(false);
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card className={isDragging ? "opacity-60" : ""}>
                <CardContent className="flex items-center gap-3 p-4">
                    <button {...attributes} {...listeners}>
                        <GripVertical size={18} />
                    </button>

                    <button onClick={() => toggleTodo(todo.id)}>
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
                            onChange={(e) => setValue(e.target.value)}
                            onBlur={save}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") save();

                                if (e.key === "Escape") {
                                    setEditing(false);
                                    setValue(todo.text);
                                }
                            }}
                            className="flex-1 border-b bg-transparent outline-none"
                        />
                    ) : (
                        <button
                            onDoubleClick={() => setEditing(true)}
                            className={`flex-1 text-left ${todo.completed
                                ? "line-through text-muted-foreground"
                                : ""
                                }`}
                        >
                            <span>{todo.text}</span>
                            {overdue && (
                                <span className="ml-2 text-xs text-red-500">
                                    overdue
                                </span>
                            )}
                        </button>
                    )}

                    <button onClick={() => togglePinned(todo.id)}>
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
                        onClick={() => deleteTodo(todo.id)}
                        className="text-muted-foreground hover:text-red-500"
                    >
                        <Trash2 size={18} />
                    </button>
                </CardContent>
            </Card>
        </div>
    );
});

/* ---------------- Main List ---------------- */

export default function TodoList() {
    const todos = useFilteredTodos();

    const reorderTodos = useTodoStore((s) => s.reorderTodos);
    const clearCompleted = useTodoStore((s) => s.clearCompleted);
    const undo = useTodoStore((s) => s.undo);
    const redo = useTodoStore((s) => s.redo);
    const setSearch = useTodoStore((s) => s.setSearch);
    const search = useTodoStore((s) => s.search);

    const setActiveCategory = useTodoStore((s) => s.setActiveCategory);
    const activeCategory = useTodoStore((s) => s.activeCategory);

    const searchRef = useRef<HTMLInputElement>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    );

    const activeTodo = useMemo(
        () => todos.find((t) => t.id === activeId) ?? null,
        [activeId, todos]
    );

    const shortcuts = useCallback(
        (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();

            if ((e.metaKey || e.ctrlKey) && k === "z") {
                e.preventDefault();
                undo();
            }

            if ((e.metaKey || e.ctrlKey) && k === "y") {
                e.preventDefault();
                redo();
            }

            if (k === "/") {
                e.preventDefault();
                searchRef.current?.focus();
            }

            if (k === "escape") setSearch("");

            if ((e.metaKey || e.ctrlKey) && e.shiftKey && k === "backspace") {
                clearCompleted();
            }
        },
        [undo, redo, clearCompleted, setSearch]
    );

    useEffect(() => {
        window.addEventListener("keydown", shortcuts);
        return () => window.removeEventListener("keydown", shortcuts);
    }, [shortcuts]);

    const onDragStart = (e: DragStartEvent) => {
        setActiveId(e.active.id as string);
    };

    const onDragEnd = (e: DragEndEvent) => {
        setActiveId(null);

        const { active, over } = e;
        if (!over || active.id === over.id) return;

        const oldIndex = todos.findIndex((t) => t.id === active.id);
        const newIndex = todos.findIndex((t) => t.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        reorderTodos(oldIndex, newIndex);
    };

    const remaining = useTodoStore((s) => s.total - s.completed);

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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tasks"
                    className="w-full rounded-md border px-3 py-2"
                />

                <div className="flex justify-between text-sm">
                    <span>{remaining} left</span>

                    <div className="flex gap-3">
                        <button onClick={undo}>Undo</button>
                        <button onClick={redo}>Redo</button>
                        <button onClick={clearCompleted}>Clear</button>
                    </div>
                </div>

                <div className="flex gap-3 text-sm">
                    {["tasks", "active", "completed", "archived"].map((v) => (
                        <button
                            key={v}
                            onClick={() => setActiveCategory(v as any)}
                            className={
                                activeCategory === v
                                    ? "font-medium"
                                    : "text-muted-foreground"
                            }
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {todos.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            No tasks found
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todos.map((t) => (
                                <TodoItem key={t.id} todo={t} />
                            ))}
                        </div>
                    )}
                </SortableContext>
            </div>

            <DragOverlay>
                {activeTodo && (
                    <Card className="border shadow">
                        <CardContent className="p-4">
                            {activeTodo.text}
                        </CardContent>
                    </Card>
                )}
            </DragOverlay>
        </DndContext>
    );
}