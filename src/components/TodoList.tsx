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
        <div className="flex gap-2">
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") setValue("");
                }}
                placeholder="Add a task..."
                className="flex-1 border rounded px-4 py-2 outline-none"
            />
            <button
                onClick={handleAdd}
                className="px-4 border rounded"
            >
                add
            </button>
        </div>
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
    const [editText, setEditText] = useState(text);

    useEffect(() => {
        setEditText(text);
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
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleSave = () => {
        const v = editText.trim();
        if (!v) {
            deleteTodo(id);
            return;
        }
        updateTodo(id, v);
        setEditing(false);
    };

    const handleCancel = () => {
        setEditText(text);
        setEditing(false);
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card className={`flex items-center ${isDragging ? "opacity-50" : ""}`}>
                <CardContent className="flex items-center gap-3 w-full">

                    <div {...attributes} {...listeners} className="cursor-grab">
                        <GripVertical size={18} />
                    </div>

                    <button onClick={() => toggleTodo(id)}>
                        <CheckCircle2 />
                    </button>

                    {editing ? (
                        <input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                                if (e.key === "Escape") handleCancel();
                            }}
                            className="flex-1 border-b outline-none"
                        />
                    ) : (
                        <span
                            onDoubleClick={() => setEditing(true)}
                            className={`flex-1 cursor-text ${completed ? "line-through text-gray-400" : ""}`}
                        >
                            {text}
                        </span>
                    )}

                    <button onClick={() => {
                        if (confirm("delete this task?")) {
                            deleteTodo(id);
                        }
                    }}>
                        <Trash2 size={18} />
                    </button>
                </CardContent>
            </Card>
        </div>
    );
});

/* ================= MAIN ================= */

export default function TodoList() {
    const { todos, reorderTodos, clearCompleted, setTodos, toggleTodo } = useTodoStore(
        (s) => ({
            todos: s.todos,
            reorderTodos: s.reorderTodos,
            clearCompleted: s.clearCompleted,
            setTodos: s.setTodos,
            toggleTodo: s.toggleTodo,
        }),
        shallow
    );

    const [activeId, setActiveId] = useState<number | null>(null);
    const [filter, setFilter] = useState<Filter>("all");

    /* ========= localStorage ========= */

    useEffect(() => {
        try {
            const saved = localStorage.getItem("todos");
            if (saved) {
                setTodos(JSON.parse(saved));
            }
        } catch {
            console.warn("failed to parse todos");
        }
    }, [setTodos]);

    useEffect(() => {
        localStorage.setItem("todos", JSON.stringify(todos));
    }, [todos]);

    /* ========= filter ========= */

    const filteredTodos = useMemo(() => {
        if (filter === "active") return todos.filter(t => !t.completed);
        if (filter === "completed") return todos.filter(t => t.completed);
        return todos;
    }, [todos, filter]);

    const remaining = todos.filter(t => !t.completed).length;

    /* ========= DND ========= */

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over };
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const oldIndex = filteredTodos.findIndex(t => t.id === active.id);
        const newIndex = filteredTodos.findIndex(t => t.id === over.id);

        const oldId = filteredTodos[oldIndex].id;
        const newId = filteredTodos[newIndex].id;

        const realOldIndex = todos.findIndex(t => t.id === oldId);
        const realNewIndex = todos.findIndex(t => t.id === newId);

        reorderTodos(realOldIndex, realNewIndex);
    };

    const activeTodo = todos.find(t => t.id === activeId);

    /* ========= bulk ========= */

    const toggleAll = () => {
        const allCompleted = todos.every(t => t.completed);
        todos.forEach(t => {
            if (t.completed === allCompleted) {
                toggleTodo(t.id);
            }
        });
    };

    /* ========= UI ========= */

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="max-w-2xl mx-auto p-6 space-y-4">

                <TodoInput />

                <div className="flex justify-between text-sm">
                    <span>{remaining} items left</span>

                    <div className="flex gap-3">
                        <button onClick={toggleAll}>
                            toggle all
                        </button>
                        <button onClick={() => {
                            if (confirm("clear completed?")) {
                                clearCompleted();
                            }
                        }}>
                            clear completed
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {["all", "active", "completed"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as Filter)}
                            className={filter === f ? "font-bold underline" : ""}
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
                            {todos.length === 0
                                ? "no tasks yet"
                                : "no tasks in this filter"}
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
                    <Card className="p-4">{activeTodo.text}</Card>
                )}
            </DragOverlay>
        </DndContext>
    );
}