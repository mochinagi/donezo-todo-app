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

/* ================= INPUT ================= */

const TodoInput = memo(function TodoInput() {
    const addTodo = useTodoStore(s => s.addTodo);
    const todos = useTodoStore(s => s.todos);

    const [value, setValue] = useState("");

    const handleAdd = useCallback(() => {
        const v = value.trim();
        if (!v) return;

        if (todos.some(t => t.text.toLowerCase() === v.toLowerCase())) {
            setValue("");
            return;
        }

        addTodo(v);
        setValue("");
    }, [value, addTodo, todos]);

    return (
        <div className="flex gap-2">
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") setValue("");
                }}
                placeholder="Add a new task"
                className="flex-1 border rounded px-4 py-2 outline-none"
            />
            <button
                onClick={handleAdd}
                disabled={!value.trim()}
                className="px-4 border rounded disabled:opacity-40"
            >
                add
            </button>
        </div>
    );
});

/* ================= ITEM ================= */

const TodoItem = memo(function TodoItem({
    id,
    text,
    completed,
}: {
    id: string;
    text: string;
    completed: boolean;
}) {
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

    const save = useCallback(() => {
        const v = editText.trim();
        if (v && v !== text) {
            updateTodo(id, v);
        }
        setEditing(false);
    }, [editText, id, text, updateTodo]);

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
                            onBlur={save}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") save();
                                if (e.key === "Escape") setEditing(false);
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

                    <button onClick={() => deleteTodo(id)}>
                        <Trash2 size={18} />
                    </button>

                </CardContent>
            </Card>
        </div>
    );
});

/* ================= MAIN ================= */

export default function TodoList() {
    const {
        todos,
        reorderTodos,
        clearCompleted,
        undo,
        redo,
    } = useTodoStore(
        (s) => ({
            todos: s.todos,
            reorderTodos: s.reorderTodos,
            clearCompleted: s.clearCompleted,
            undo: s.undo,
            redo: s.redo,
        }),
        shallow
    );

    const [activeId, setActiveId] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
    const [search, setSearch] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    );

    const filteredTodos = useMemo(() => {
        return todos
            .filter(t => {
                if (filter === "active") return !t.completed;
                if (filter === "completed") return t.completed;
                return true;
            })
            .filter(t =>
                t.text.toLowerCase().includes(search.toLowerCase())
            );
    }, [todos, filter, search]);

    const activeTodo = todos.find(t => t.id === activeId);

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveId(null);

        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = todos.findIndex(t => t.id === active.id);
        const newIndex = todos.findIndex(t => t.id === over.id);

        reorderTodos(oldIndex, newIndex);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="max-w-2xl mx-auto p-6 space-y-4">

                <TodoInput />

                <input
                    placeholder="search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                />

                <div className="flex justify-between text-sm">
                    <span>{todos.filter(t => !t.completed).length} items left</span>

                    <div className="flex gap-3">
                        <button onClick={undo}>undo</button>
                        <button onClick={redo}>redo</button>
                        <button onClick={clearCompleted}>clear completed</button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {(["all", "active", "completed"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={filter === f ? "font-bold underline" : "opacity-60"}
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
                        <div className="text-center text-sm opacity-50">
                            no tasks
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
                    <Card className="p-4">
                        {activeTodo.text}
                    </Card>
                )}
            </DragOverlay>
        </DndContext>
    );
}