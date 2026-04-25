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

type Filter = "all" | "active" | "completed";

type Todo = {
    id: number;
    text: string;
    completed: boolean;
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
    dragHandleProps: any;
};

/* ================= INPUT ================= */

const TodoInput = memo(function TodoInput() {
    const addTodo = useTodoStore(s => s.addTodo);

    const [value, setValue] = useState("");

    const handleAdd = useCallback(() => {
        const v = value.trim();
        if (!v) return;

        addTodo(v);
        setValue("");
    }, [value, addTodo]);

    return (
        <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
            }}
            placeholder="Add a task..."
            className="w-full border rounded px-4 py-2 outline-none"
        />
    );
});

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
            onDelete();
            return;
        }

        if (trimmed !== text) {
            onEditSave(trimmed);
        } else {
            onEditCancel();
        }
    }, [editText, text, onEditSave, onEditCancel, onDelete]);

    return (
        <Card
            className={`group flex items-center justify-between transition
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
                        onBlur={handleSave}
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

export default function TodoList() {
    const { todos, reorderTodos, clearCompleted } = useTodoStore(
        (s) => ({
            todos: s.todos,
            reorderTodos: s.reorderTodos,
            clearCompleted: s.clearCompleted,
        }),
        shallow
    );

    const [activeId, setActiveId] = useState<number | null>(null);
    const [filter, setFilter] = useState<Filter>("all");

    const filteredTodos = useMemo(() => {
        if (filter === "active") return todos.filter(t => !t.completed);
        if (filter === "completed") return todos.filter(t => t.completed);
        return todos;
    }, [todos, filter]);

    const remaining = todos.filter(t => !t.completed).length;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over };
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const oldIndex = todos.findIndex(t => t.id === active.id);
        const newIndex = todos.findIndex(t => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            reorderTodos(oldIndex, newIndex);
        }
    }, [todos, reorderTodos]);

    const activeTodo = todos.find(t => t.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="max-w-2xl mx-auto p-6 space-y-4">

                <TodoInput />

                <div className="flex justify-between text-sm text-gray-500">
                    <span>{remaining} items left</span>
                    <button onClick={clearCompleted}>
                        clear completed
                    </button>
                </div>

                <div className="flex gap-2">
                    {["all", "active", "completed"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as Filter)}
                            className={`px-3 py-1 rounded 
                                ${filter === f ? "bg-blue-600 text-white" : "bg-gray-200"}
                            `}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <SortableContext
                    items={filteredTodos.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {filteredTodos.length === 0 ? (
                        <div className="text-center text-gray-400 py-10">
                            nothing here
                        </div>
                    ) : (
                        filteredTodos.map(todo => (
                            <TodoItem key={todo.id} {...todo} />
                        ))
                    )}
                </SortableContext>
            </div>

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