"use client";

import { memo, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, CheckCircle2, GripVertical } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";

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

type TodoItemUIProps = {
    text: string;
    completed: boolean;
    dragging?: boolean;
    isEditing: boolean;
    onToggle: () => void;
    onDelete: () => void;
    onEditStart: () => void;
    onEditSave: (val: string) => void;
    onEditCancel: () => void;
    dragHandleProps?: any;
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

    const handleSave = () => {
        const trimmed = editText.trim();
        if (trimmed) onEditSave(trimmed);
        else onEditCancel();
    };

    return (
        <Card
            className={`group flex items-center justify-between transition-all duration-200 select-none
            ${completed ? "opacity-60 scale-[0.98]" : "hover:scale-[1.02]"}
            ${dragging ? "shadow-xl rotate-1 pointer-events-none" : ""}
        `}
        >
            <CardContent className="flex items-center gap-4 w-full">

                {/* ✅ 只允许这里拖 */}
                <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-gray-400"
                >
                    <GripVertical size={20} />
                </div>

                <button
                    onClick={onToggle}
                    disabled={dragging}
                    className={`p-2 rounded-full transition
                        ${completed
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                >
                    <CheckCircle2 size={20} />
                </button>

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
                        className="flex-1 bg-transparent border-b outline-none"
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

                <div className="opacity-0 group-hover:opacity-100 transition">
                    <button
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

export default function TodoList({ setIsDragging }: { setIsDragging?: (v: boolean) => void }) {
    const todos = useTodoStore((s) => s.filteredTodos());
    const reorderTodos = useTodoStore((s) => s.reorderTodos);

    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const getIndex = useCallback(
        (id: number) => todos.findIndex((t) => t.id === id),
        [todos]
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
        setIsDragging?.(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setIsDragging?.(false);

        if (!over || active.id === over.id) return;

        const oldIndex = getIndex(active.id as number);
        const newIndex = getIndex(over.id as number);

        reorderTodos(oldIndex, newIndex);
    };

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
                    {todos.map((todo) => (
                        <TodoItem key={todo.id} {...todo} />
                    ))}
                </section>
            </SortableContext>

            <DragOverlay>
                {activeTodo && (
                    <div className="opacity-80 scale-105">
                        <TodoItemUI
                            {...activeTodo}
                            isEditing={false}
                            onToggle={() => { }}
                            onDelete={() => { }}
                            onEditStart={() => { }}
                            onEditSave={() => { }}
                            onEditCancel={() => { }}
                            dragging
                        />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}