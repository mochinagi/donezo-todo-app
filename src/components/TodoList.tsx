"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    createdAt: number;
};

/* ================= INPUT ================= */

const TodoInput = memo(function TodoInput() {
    const addTodo = useTodoStore(s => s.addTodo);
    const todos = useTodoStore(s => s.todos);
    const [value, setValue] = useState("");

    const normalize = (v: string) =>
        v.trim().replace(/\s+/g, " ");

    const handleAdd = useCallback(() => {
        const v = normalize(value);
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

    const handleSave = useCallback(() => {
        const v = editText.trim();

        if (!v) {
            deleteTodo(id);
            return;
        }

        if (v !== text) {
            updateTodo(id, v);
        }

        setEditing(false);
    }, [editText, id, updateTodo, deleteTodo, text]);

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

                    <button
                        onClick={() => {
                            if (confirm("delete this task?")) deleteTodo(id);
                        }}
                    >
                        <Trash2 size={18} />
                    </button>
                </CardContent>
            </Card>
        </div>
    );
});

/* ================= MAIN ================= */

export default function TodoList() {
    const { todos, setTodos, clearCompleted } =
        useTodoStore(
            (s) => ({
                todos: s.todos,
                setTodos: s.setTodos,
                clearCompleted: s.clearCompleted,
            }),
            shallow
        );

    const [activeId, setActiveId] = useState<number | null>(null);
    const [filter, setFilter] = useState<Filter>("all");

    const historyRef = useRef<Todo[][]>([]);

    const pushHistory = () => {
        historyRef.current.push(todos);
        if (historyRef.current.length > 20) {
            historyRef.current.shift();
        }
    };

    const undo = () => {
        const prev = historyRef.current.pop();
        if (prev) setTodos(prev);
    };

    /* ========= localStorage ========= */

    useEffect(() => {
        try {
            const saved = localStorage.getItem("todos_v3");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed?.version === 1 && Array.isArray(parsed.data)) {
                    setTodos(parsed.data);
                }
            }
        } catch { }
    }, [setTodos]);

    useEffect(() => {
        localStorage.setItem(
            "todos_v3",
            JSON.stringify({ version: 1, data: todos })
        );
    }, [todos]);

    /* ========= filter ========= */

    const filteredTodos = useMemo(() => {
        if (filter === "active") return todos.filter(t => !t.completed);
        if (filter === "completed") return todos.filter(t => t.completed);
        return todos;
    }, [todos, filter]);

    const remaining = useMemo(
        () => todos.filter(t => !t.completed).length,
        [todos]
    );

    /* ========= DND ========= */

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        if (filter !== "all") return;

        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = todos.findIndex(t => t.id === active.id);
        const newIndex = todos.findIndex(t => t.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        pushHistory();

        const newTodos = [...todos];
        const [moved] = newTodos.splice(oldIndex, 1);
        newTodos.splice(newIndex, 0, moved);

        setTodos(newTodos);
    };

    const activeTodo = todos.find(t => t.id === activeId);

    /* ========= bulk ========= */

    const toggleAll = useCallback(() => {
        pushHistory();

        const allCompleted = todos.every(t => t.completed);
        setTodos(
            todos.map(t => ({
                ...t,
                completed: !allCompleted,
            }))
        );
    }, [todos, setTodos]);

    const handleClearCompleted = () => {
        pushHistory();
        clearCompleted();
        setFilter("all");
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

                        <button
                            disabled={!todos.some(t => t.completed)}
                            onClick={handleClearCompleted}
                        >
                            clear completed
                        </button>

                        <button
                            onClick={undo}
                            disabled={historyRef.current.length === 0}
                        >
                            undo
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {(["all", "active", "completed"] as Filter[]).map(f => (
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
                        <div className="text-center text-gray-400 py-10">
                            {todos.length === 0 ? "no tasks yet" : "no tasks under this filter"}
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