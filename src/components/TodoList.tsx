"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, CheckCircle2, GripVertical } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";

import {
    DndContext,
    closestCenter,
    PointerSensor,
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

interface TodoProps {
    id: number;
    text: string;
    completed: boolean;
}

interface TodoListProps {
    setIsDragging?: (dragging: boolean) => void;
    setSidebarOpen?: (open: boolean) => void;
}

/** 🔥 纯 UI（不带拖拽逻辑） */
const TodoItemUI = ({
    text,
    completed,
    onToggle,
    onDelete,
    dragging,
}: any) => {
    const buttonClass = completed
        ? "bg-blue-600 text-white shadow"
        : "bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300";

    return (
        <Card
            className={`flex items-center justify-between transition-all duration-200
            ${completed ? "opacity-60 scale-[0.98]" : "hover:scale-[1.02]"}
            ${dragging ? "shadow-xl rotate-1" : ""}
        `}
        >
            <CardContent className="flex items-center gap-4 w-full">

                {/* 🟰 Drag Handle */}
                <div className="cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical size={20} />
                </div>

                <button
                    onClick={onToggle}
                    disabled={dragging}
                    className={`p-2 rounded-full transition ${buttonClass}`}
                >
                    <CheckCircle2 size={20} />
                </button>

                <span
                    onClick={onToggle}
                    className={`flex-1 cursor-pointer text-lg ${completed
                        ? "line-through text-gray-400"
                        : "hover:text-blue-500"
                        }`}
                >
                    {text}
                </span>

                <button
                    onClick={onDelete}
                    disabled={dragging}
                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                >
                    <Trash2 size={20} />
                </button>
            </CardContent>
        </Card>
    );
};

/** 🔥 带拖拽逻辑 */
const TodoItem = memo(function TodoItem({ id, text, completed }: TodoProps) {
    const { toggleTodo, deleteTodo } = useTodoStore();

    const handleToggle = useCallback(() => toggleTodo(id), [id, toggleTodo]);
    const handleDelete = useCallback(() => deleteTodo(id), [id, deleteTodo]);

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
        willChange: "transform",
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            {/* 👇 只让 handle 可拖拽 */}
            <div {...listeners}>
                <TodoItemUI
                    text={text}
                    completed={completed}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    dragging={isDragging}
                />
            </div>
        </div>
    );
});

export default function TodoList({
    setIsDragging,
    setSidebarOpen,
}: TodoListProps) {
    const todos = useTodoStore((s) => s.filteredTodos());
    const reorderTodos = useTodoStore((s) => s.reorderTodos);

    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 👈 防误触关键
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
        setIsDragging?.(true);
        setSidebarOpen?.(false);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setIsDragging?.(false);

        if (over && active.id !== over.id) {
            const oldIndex = todos.findIndex((t) => t.id === active.id);
            const newIndex = todos.findIndex((t) => t.id === over.id);
            reorderTodos(oldIndex, newIndex);
        }
    };

    const activeTodo = todos.find((t) => t.id === activeId);

    if (todos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center mt-24 text-gray-500 space-y-4 animate-fade-in">
                <CheckCircle2 size={48} className="opacity-20" />
                <p className="text-lg font-semibold">まだタスクがありません</p>
                <p className="text-sm text-gray-400">
                    最初のタスクを追加してみよう ✨
                </p>
            </div>
        );
    }

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
                <section className="flex-1 overflow-y-auto p-6 space-y-4 max-w-2xl mx-auto">
                    {todos.map((todo) => (
                        <TodoItem key={todo.id} {...todo} />
                    ))}
                </section>
            </SortableContext>

            {/* 🔥 Drag Overlay */}
            <DragOverlay>
                {activeTodo ? (
                    <div className="opacity-90 scale-105 pointer-events-none">
                        <TodoItemUI
                            text={activeTodo.text}
                            completed={activeTodo.completed}
                            dragging
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}