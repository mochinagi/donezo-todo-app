"use client";

import { memo, useCallback, useEffect, useState } from "react";
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
    type DraggableAttributes,
} from "@dnd-kit/core";

import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

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

type DragHandleProps = DraggableAttributes & SyntheticListenerMap;

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
    dragHandleProps: DragHandleProps;
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
            className={`group flex items-center justify-between transition-all duration-200 select-none
            ${completed ? "opacity-60" : "hover:scale-[1.02]"}
            ${dragging ? "shadow-xl scale-105 opacity-80 cursor-grabbing" : ""}
        `}
        >
            <CardContent className="flex items-center gap-4 w-full">

                {/* drag */}
                <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-gray-400"
                >
                    <GripVertical size={20} />
                </div>

                {/* toggle */}
                <button
                    aria-label="toggle todo"
                    onClick={onToggle}
                    disabled={dragging}
                    className={`p-2 rounded-full transition
                        ${completed
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                        }`}
                >
                    <CheckCircle2 size={20} />
                </button>

                {/* text */}
                {isEditing ? (
                    <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") onEditCancel();
                        }}
                        className="flex-1 bg-transparent border-b outline-none focus:border-blue-500"
                    />
                ) : (
                    <span
                        onDoubleClick={onEditStart}
                        className={`flex-1 cursor-pointer text-lg
                            ${completed
                                ? "line-through text-gray-400"
                                : "hover:text-blue-500"
                            }`}
                    >
                        {text}
                    </span>
                )}

                {/* delete */}
                <div className="opacity-0 group-hover:opacity-100 transition">
                    <button
                        aria-label="delete todo"
                        onClick={onDelete}
                        disabled={dragging}
                        className="p-2 rounded-md text-gray-400 hover:text-red-500"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
});

/* ================= ITEM ================= */

const TodoItem = memo(function TodoItem({ id, text, completed }: Todo) {
    const { toggleTodo, deleteTodo, updateTodo } = useTodoStore();
    const [editing, setEditing] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

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
                onEditSave={(val) => {
                    updateTodo(id, val);
                    setEditing(false);
                }}
                onEditCancel={() => setEditing(false)}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
});

/* ================= LIST ================= */

export default function TodoList({
    setIsDragging,
}: {
    setIsDragging?: (v: boolean) => void;
}) {
    const todos = useTodoStore((s) => s.filteredTodos, shallow);
    const reorderTodos = useTodoStore((s) => s.reorderTodos);

    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            setActiveId(event.active.id as number);
            setIsDragging?.(true);
        },
        [setIsDragging]
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over };

            setActiveId(null);
            setIsDragging?.(false);

            if (!over || active.id === over.id) return;

            const oldIndex = todos.findIndex((t) => t.id === active.id);
            const newIndex = todos.findIndex((t) => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                reorderTodos(oldIndex, newIndex);
            }
        },
        [todos, reorderTodos, setIsDragging]
    );

    const activeTodo = todos.find((t) => t.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={todos.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <section className="flex-1 p-6 space-y-4 max-w-2xl mx-auto">
                    {todos.length === 0 ? (
                        <div className="text-center text-gray-400 text-lg">
                            ✨ Start small. Add your first task.
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
                    <div className="opacity-90 scale-105 pointer-events-none">
                        <TodoItemUI
                            {...activeTodo}
                            isEditing={false}
                            onToggle={() => { }}
                            onDelete={() => { }}
                            onEditStart={() => { }}
                            onEditSave={() => { }}
                            onEditCancel={() => { }}
                            dragging
                            dragHandleProps={{}}
                        />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}