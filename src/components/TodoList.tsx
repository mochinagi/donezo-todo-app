"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
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
} from "lucide-react";

import {
    useTodoStore,
    useFilteredTodos,
} from "@/store/todoStore";

import { shallow } from "zustand/shallow";

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
    const addTodo = useTodoStore(
        (s) => s.addTodo
    );

    const todos = useTodoStore(
        (s) => s.todos
    );

    const [value, setValue] = useState("");

    const handleSubmit = useCallback(() => {
        const text = value.trim();

        if (!text) {
            return;
        }

        const duplicated = todos.some(
            (todo) =>
                todo.normalized ===
                text
                    .trim()
                    .replace(/\s+/g, " ")
                    .toLowerCase()
        );

        if (duplicated) {
            setValue("");
            return;
        }

        addTodo(text);

        setValue("");
    }, [value, todos, addTodo]);

    return (
        <div className="flex gap-2">
            <input
                value={value}
                onChange={(e) =>
                    setValue(e.target.value)
                }
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleSubmit();
                    }

                    if (e.key === "Escape") {
                        setValue("");
                    }
                }}
                placeholder="Add task"
                className="flex-1 rounded-md border bg-background px-3 py-2 outline-none transition"
            />

            <button
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="rounded-md border px-4 text-sm transition disabled:opacity-40"
            >
                Add
            </button>
        </div>
    );
});

type TodoItemProps = {
    id: string;
    text: string;
    completed: boolean;
};

const TodoItem = memo(function TodoItem({
    id,
    text,
    completed,
}: TodoItemProps) {
    const {
        toggleTodo,
        deleteTodo,
        updateTodo,
    } = useTodoStore(
        (state) => ({
            toggleTodo: state.toggleTodo,
            deleteTodo: state.deleteTodo,
            updateTodo: state.updateTodo,
        }),
        shallow
    );

    const [editing, setEditing] =
        useState(false);

    const [value, setValue] =
        useState(text);

    useEffect(() => {
        setValue(text);
    }, [text]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        disabled: editing,
    });

    const style = {
        transform:
            CSS.Transform.toString(transform),
        transition,
    };

    const save = useCallback(() => {
        const next = value.trim();

        if (
            next &&
            next !== text
        ) {
            updateTodo(id, next);
        }

        setEditing(false);
    }, [value, text, id, updateTodo]);

    return (
        <div
            ref={setNodeRef}
            style={style}
        >
            <Card
                className={
                    isDragging
                        ? "opacity-60"
                        : ""
                }
            >
                <CardContent className="flex items-center gap-3 p-4">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-muted-foreground"
                    >
                        <GripVertical size={18} />
                    </button>

                    <button
                        onClick={() =>
                            toggleTodo(id)
                        }
                        className={
                            completed
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
                                setValue(
                                    e.target.value
                                )
                            }
                            onBlur={save}
                            onKeyDown={(e) => {
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
                                        text
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
                            className={`flex-1 text-left ${completed
                                ? "text-muted-foreground line-through"
                                : ""
                                }`}
                        >
                            {text}
                        </button>
                    )}

                    <button
                        onClick={() =>
                            deleteTodo(id)
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

    const {
        reorderTodos,
        clearCompleted,
        undo,
        redo,
        completed,
        total,
        search,
        setSearch,
        activeCategory,
        setActiveCategory,
    } = useTodoStore(
        (state) => ({
            reorderTodos:
                state.reorderTodos,
            clearCompleted:
                state.clearCompleted,
            undo: state.undo,
            redo: state.redo,
            completed: state.completed,
            total: state.total,
            search: state.search,
            setSearch:
                state.setSearch,
            activeCategory:
                state.activeCategory,
            setActiveCategory:
                state.setActiveCategory,
        }),
        shallow
    );

    const [activeId, setActiveId] =
        useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 6,
            },
        }),
        useSensor(KeyboardSensor)
    );

    useEffect(() => {
        const onKeyDown = (
            e: KeyboardEvent
        ) => {
            const isUndo =
                (e.metaKey || e.ctrlKey) &&
                e.key.toLowerCase() === "z";

            const isRedo =
                (e.metaKey || e.ctrlKey) &&
                e.key.toLowerCase() === "y";

            if (isUndo) {
                e.preventDefault();
                undo();
            }

            if (isRedo) {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener(
            "keydown",
            onKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                onKeyDown
            );
        };
    }, [undo, redo]);

    const activeTodo = useMemo(
        () =>
            activeId
                ? todos.find(
                    (todo) =>
                        todo.id === activeId
                )
                : null,
        [activeId, todos]
    );

    const onDragStart = (
        event: DragStartEvent
    ) => {
        setActiveId(
            event.active.id as string
        );
    };

    const onDragEnd = (
        event: DragEndEvent
    ) => {
        setActiveId(null);

        const { active, over } =
            event;

        if (
            !over ||
            active.id === over.id
        ) {
            return;
        }

        const oldIndex =
            todos.findIndex(
                (todo) =>
                    todo.id === active.id
            );

        const newIndex =
            todos.findIndex(
                (todo) =>
                    todo.id === over.id
            );

        if (
            oldIndex === -1 ||
            newIndex === -1
        ) {
            return;
        }

        reorderTodos(
            oldIndex,
            newIndex
        );
    };

    const remainingCount =
        total - completed;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={
                closestCenter
            }
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="mx-auto max-w-2xl space-y-4 p-6">
                <TodoInput />

                <input
                    placeholder="Search tasks"
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
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
                            onClick={
                                clearCompleted
                            }
                            className="transition hover:opacity-70"
                        >
                            Clear completed
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 text-sm">
                    {(
                        [
                            "tasks",
                            "active",
                            "completed",
                        ] as const
                    ).map((value) => (
                        <button
                            key={value}
                            onClick={() =>
                                setActiveCategory(
                                    value
                                )
                            }
                            className={
                                activeCategory ===
                                    value
                                    ? "font-medium"
                                    : "text-muted-foreground"
                            }
                        >
                            {value}
                        </button>
                    ))}
                </div>

                <SortableContext
                    items={todos.map(
                        (todo) => todo.id
                    )}
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
                                    id={todo.id}
                                    text={todo.text}
                                    completed={
                                        todo.completed
                                    }
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
                            {
                                activeTodo.text
                            }
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}