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
}: any) {
    const [editText, setEditText] = useState(text);

    useEffect(() => {
        setEditText(text);
    }, [text]);

    const handleSave = useCallback(() => {
        const trimmed = editText.trim();
        if (!trimmed) return onEditCancel();
        trimmed !== text ? onEditSave(trimmed) : onEditCancel();
    }, [editText, text]);

    return (
        <Card
            className={`group flex items-center justify-between transition-all duration-200
            ${completed ? "opacity-60" : "hover:scale-[1.02]"}
            ${dragging ? "shadow-xl scale-105 opacity-80" : ""}
        `}
        >
            <CardContent className="flex items-center gap-4 w-full">

                {/* drag */}
                {!isEditing && (
                    <div
                        {...dragHandleProps}
                        className="cursor-grab text-gray-400 opacity-0 group-hover:opacity-100"
                    >
                        <GripVertical size={20} />
                    </div>
                )}

                {/* toggle */}
                <button
                    onClick={onToggle}
                    disabled={dragging}
                    className={`p-2 rounded-full
                        ${completed
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-400"
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
                        onFocus={(e) => e.target.select()}
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

                {/* delete */}
                <div className="opacity-0 group-hover:opacity-100">
                    <button onClick={onDelete}>
                        <Trash2 size={20} />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
});

/* ================= ITEM ================= */

const TodoItem = memo(function TodoItem({ id, text, completed }: Todo) {
    const toggleTodo = useTodoStore((s) => s.toggleTodo);
    const deleteTodo = useTodoStore((s) => s.deleteTodo);
    const updateTodo = useTodoStore((s) => s.updateTodo);

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
                onEditSave={(val: string) => {
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

export default function TodoList({ setIsDragging }: any) {
    const todos = useTodoStore((s) => s.todos, shallow); // ⚠️ 改这里
    const reorderTodos = useTodoStore((s) => s.reorderTodos);

    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as number);
        setIsDragging?.(true);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over };

        setActiveId(null);
        setIsDragging?.(false);

        if (!over || active.id === over.id) return;

        const oldIndex = todos.findIndex((t) => t.id === active.id);
        const newIndex = todos.findIndex((t) => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            reorderTodos(oldIndex, newIndex);
        }
    }, [todos]);

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
                items={todos.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <section className="p-6 space-y-4 max-w-2xl mx-auto">
                    {todos.length === 0 ? (
                        <div className="text-center text-gray-400">
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
                )}
            </DragOverlay>
        </DndContext>
    );
}