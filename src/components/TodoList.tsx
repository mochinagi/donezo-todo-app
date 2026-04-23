"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, CheckCircle2, GripVertical } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";
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

/* ================= TYPES ================= */

type Todo = {
    id: number;
    text: string;
    completed: boolean;
};

type TodoListProps = {
    setIsDragging?: (dragging: boolean) => void;
};

type TodoItemUIProps = {
    text: string;
    completed: boolean;
    dragging: boolean;
    isEditing: boolean;
    onToggle: () => void;
    onDelete: () => void;
    onEditStart: () => void;
    onEditSave: (val: string) => void;
    onEditCancel: () => void;
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};

/* ================= UI ================= */

const TodoItemUI = memo(function TodoItemUI({
    text,
    completed,
    dragging,
    isEditing,
    onToggle,
    onDelete,
    onEditStart,
    onEditSave,
    onEditCancel,
    dragHandleProps,
}: TodoItemUIProps) {
    const [editText, setEditText] = useState(text);

    useEffect(() => {
        setEditText(text);
    }, [text]);

    const handleSave = useCallback(() => {
        const trimmed = editText.trim();

        if (!trimmed) {
            onEditCancel();
            return;
        }

        if (trimmed !== text) {
            onEditSave(trimmed);
        } else {
            onEditCancel();
        }
    }, [editText, text, onEditSave, onEditCancel]);

    return (
        <Card
            className={`group flex items-center justify-between transition-all duration-200
            ${completed ? "opacity-60" : "hover:scale-[1.02]"}
            ${dragging ? "shadow-xl scale-105 opacity-80" : ""}
        `}
        >
            <CardContent className="flex items-center gap-4 w-full">

                {!isEditing && (
                    <div
                        {...dragHandleProps}
                        className="cursor-grab text-gray-400 opacity-0 group-hover:opacity-100"
                    >
                        <GripVertical size={20} />
                    </div>
                )}

                <button
                    aria-label="toggle todo"
                    onClick={onToggle}
                    disabled={dragging || isEditing}
                    className={`p-2 rounded-full transition
                        ${completed
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                >
                    <CheckCircle2 size={20} />
                </button>

                {isEditing ? (
                    <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") onEditCancel();
                        }}
                        className="flex-1 border-b outline-none"
                    />
                ) : (
                    <span
                        onDoubleClick={onEditStart}
                        className={`flex-1 cursor-pointer text-lg
                            ${completed ? "line-through text-gray-400" : ""}
                        `}
                    >
                        {text}
                    </span>
                )}

                <button
                    aria-label="delete todo"
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-red-500"
                >
                    <Trash2 size={20} />
                </button>
            </CardContent>
        </Card>
    );
});

/* ================= ITEM ================= */

const TodoItem = memo(function TodoItem({ id, text, completed }: Todo) {
    const { toggleTodo, deleteTodo, updateTodo } = useTodoStore(
        (s) => ({
            toggleTodo: s.toggleTodo,
            deleteTodo: s.deleteTodo,
            updateTodo: s.updateTodo,
        }),
        shallow
    );

    const [editing, setEditing] = useState(false);

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
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleSave = useCallback(
        (val: string) => {
            updateTodo(id, val);
            setEditing(false);
        },
        [id, updateTodo]
    );

    return (
        <div ref={setNodeRef} style={style}>
            <TodoItemUI
                text={text}
                completed={completed}
                dragging={isDragging}
                isEditing={editing}
                onToggle={() => toggleTodo(id)}
                onDelete={() => deleteTodo(id)}
                onEditStart={() => setEditing(true)}
                onEditSave={handleSave}
                onEditCancel={() => setEditing(false)}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
});

/* ================= LIST ================= */

export default function TodoList({ setIsDragging }: TodoListProps) {
    const todos = useTodoStore((s) => s.todos, shallow);
    const reorderTodos = useTodoStore((s) => s.reorderTodos);

    const [activeId, setActiveId] = useState<number | null>(null);

    const todoIds = useMemo(() => todos.map((t) => t.id), [todos]);

    const indexMap = useMemo(() => {
        const map = new Map<number, number>();
        todos.forEach((t, i) => map.set(t.id, i));
        return map;
    }, [todos]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as number);
        setIsDragging?.(true);
    }, [setIsDragging]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over };

        setActiveId(null);
        setIsDragging?.(false);

        if (!over || active.id === over.id) return;

        const oldIndex = indexMap.get(active.id as number);
        const newIndex = indexMap.get(over.id as number);

        if (oldIndex !== undefined && newIndex !== undefined) {
            reorderTodos(oldIndex, newIndex);
        }
    }, [indexMap, reorderTodos, setIsDragging]);

    const activeTodo = useMemo(
        () => todos.find((t) => t.id === activeId),
        [activeId, todos]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={todoIds}
                strategy={verticalListSortingStrategy}
            >
                <section className="p-6 space-y-4 max-w-2xl mx-auto">
                    {todos.length === 0 ? (
                        <div className="text-center text-gray-400">
                            Start small. Your first task matters.
                        </div>
                    ) : (
                        todos.map((todo) => (
                            <TodoItem key={todo.id} {...todo} />
                        ))
                    )}
                </section>
            </SortableContext>

            <DragOverlay>
                {activeTodo && (
                    <div className="scale-105 opacity-90">
                        <TodoItemUI
                            {...activeTodo}
                            isEditing={false}
                            dragging
                            onToggle={() => { }}
                            onDelete={() => { }}
                            onEditStart={() => { }}
                            onEditSave={() => { }}
                            onEditCancel={() => { }}
                            dragHandleProps={{}}
                        />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}