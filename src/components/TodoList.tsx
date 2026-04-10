"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, CheckCircle2 } from "lucide-react";
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

/** 单个 TodoItem */
const TodoItem = memo(function TodoItem({ id, text, completed }: TodoProps) {
    const { toggleTodo, deleteTodo } = useTodoStore();

    const handleToggle = useCallback(() => toggleTodo(id), [id, toggleTodo]);

    const handleDelete = useCallback(() => {
        deleteTodo(id);
    }, [id, deleteTodo]);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const buttonClass = useMemo(
        () =>
            completed
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300",
        [completed]
    );

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex items-center justify-between transition-all duration-200
                ${completed ? "opacity-60 scale-[0.98]" : "hover:scale-[1.02]"}
                ${isDragging ? "shadow-xl rotate-1" : ""}
            `}
        >
            <CardContent className="flex items-center gap-4 w-full">
                <button
                    onClick={handleToggle}
                    className={`p-2 rounded-full transition ${buttonClass}`}
                >
                    <CheckCircle2 size={20} />
                </button>

                <span
                    onClick={handleToggle}
                    className={`flex-1 cursor-pointer text-lg ${completed
                        ? "line-through text-gray-400"
                        : "hover:text-blue-500"
                        }`}
                >
                    {text}
                </span>

                <button
                    onClick={handleDelete}
                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                >
                    <Trash2 size={20} />
                </button>
            </CardContent>
        </Card>
    );
});

export default function TodoList({
    setIsDragging,
    setSidebarOpen,
}: TodoListProps) {
    const todos = useTodoStore((s) => s.filteredTodos());
    const reorderTodos = useTodoStore((s) => s.reorderTodos);

    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(useSensor(PointerSensor));

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

    if (todos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center mt-24 text-gray-500 space-y-4">
                <CheckCircle2 size={48} className="opacity-20" />
                <p className="text-lg font-semibold">まだタスクがありません</p>
                <p className="text-sm text-gray-400">
                    新しいタスクを追加して始めましょう ✨
                </p>
            </div>
        );
    }

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
                <section className="flex-1 overflow-y-auto p-6 space-y-4 max-w-2xl mx-auto">
                    {todos.map((todo) => (
                        <TodoItem key={todo.id} {...todo} />
                    ))}
                </section>
            </SortableContext>

            {/* 🔥 拖拽浮层 */}
            <DragOverlay>
                {activeTodo ? (
                    <div className="opacity-80 scale-105">
                        <TodoItem {...activeTodo} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}