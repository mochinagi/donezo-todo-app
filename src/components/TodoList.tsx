"use client";

import { memo, useCallback, useMemo } from "react";
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

/** 可拖拽 TodoItem */
const TodoItem: React.FC<TodoProps> = memo(function TodoItem({ id, text, completed }) {
    const toggleTodo = useTodoStore((s) => s.toggleTodo);
    const deleteTodo = useTodoStore((s) => s.deleteTodo);

    const handleToggle = useCallback(() => toggleTodo(id), [id, toggleTodo]);
    const handleDelete = useCallback(() => {
        if (window.confirm("このタスクを削除しますか？")) deleteTodo(id);
    }, [id, deleteTodo]);

    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const buttonClass = useMemo(
        () =>
            completed
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300",
        [completed]
    );

    const textClass = useMemo(
        () =>
            completed
                ? "line-through text-gray-400"
                : "text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400",
        [completed]
    );

    return (
        <Card
            role="listitem"
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex items-center justify-between transition-all duration-200 ${completed ? "opacity-60 scale-[0.98]" : "hover:scale-[1.02]"}`
            }
        >
            <CardContent className="flex items-center gap-4 w-full">
                {/* 完了ボタン */}
                <button
                    onClick={handleToggle}
                    aria-pressed={completed}
                    aria-label={completed ? "未完了に戻す" : "完了にする"}
                    title={completed ? "Mark as incomplete" : "Mark as complete"}
                    className={`p-2 rounded-full transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-400 ${buttonClass}`}
                >
                    <CheckCircle2 size={20} />
                </button>

                {/* タスクテキスト */}
                <span
                    onClick={handleToggle}
                    className={`flex-1 text-left break-words text-lg transition-colors cursor-pointer ${textClass}`}
                >
                    {text}
                </span>

                {/* 削除ボタン */}
                <button
                    onClick={handleDelete}
                    aria-label="タスクを削除"
                    title="Delete task"
                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                >
                    <Trash2 size={20} />
                </button>
            </CardContent>
        </Card>
    );
});

export default function TodoList({ setIsDragging, setSidebarOpen }: TodoListProps) {
    const todos = useTodoStore((s) => s.filteredTodos());
    const reorderTodos = useTodoStore((s) => s.reorderTodos);

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragStart = (event: DragStartEvent) => {
        if (setIsDragging) setIsDragging(true);
        if (setSidebarOpen) setSidebarOpen(false); // 拖拽时收起 Sidebar
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (setIsDragging) setIsDragging(false);

        if (over && active.id !== over.id) {
            const oldIndex = todos.findIndex((t) => t.id === active.id);
            const newIndex = todos.findIndex((t) => t.id === over.id);
            reorderTodos(oldIndex, newIndex);
        }
    };

    if (todos.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center mt-24 text-gray-500 space-y-3 animate-fade-in"
                aria-live="polite"
            >
                <CheckCircle2 size={40} className="opacity-30" />
                <p className="text-lg font-medium">タスクがまだありません</p>
                <p className="text-sm text-gray-400">最初のタスクを追加してみましょう 🚀</p>
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
            <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <section
                    role="list"
                    className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-950 space-y-4 max-w-2xl mx-auto"
                >
                    {todos.map((todo) => (
                        <TodoItem key={todo.id} {...todo} />
                    ))}
                </section>
            </SortableContext>
        </DndContext>
    );
}