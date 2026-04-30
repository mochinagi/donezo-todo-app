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
    const inputRef = useRef<HTMLInputElement>(null);

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
        inputRef.current?.focus();
    }, [value, addTodo, todos]);

    return (
        <div className="flex gap-2">
            <input
                ref={inputRef}
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
    const [confirmDelete, setConfirmDelete] = useState(false);

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
        if (!v) return;

        if (v !== text) {
            updateTodo(id, v);
        }

        setEditing(false);
    }, [editText, id, updateTodo, text]);

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 1500);
            return;
        }
        deleteTodo(id);
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
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
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

                    <button onClick={handleDelete}>
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
    const [search, setSearch] = useState("");

    const historyRef = useRef<Todo[][]>([]);
    const redoRef = useRef<Todo[][]>([]);

    const pushHistory = () => {
        historyRef.current.push(structuredClone(todos));
        redoRef.current = [];
    };

    const undo = () => {
        const prev = historyRef.current.pop();
        if (prev) {
            redoRef.current.push(structuredClone(todos));
            setTodos(prev);
        }
    };

    const redo = () => {
        const next = redoRef.current.pop();
        if (next) {
            historyRef.current.push(structuredClone(todos));
            setTodos(next);
        }
    };

    /* ========= localStorage ========= */

    useEffect(() => {
        try {
            const saved = localStorage.getItem("todos_v4");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed.data)) {
                    setTodos(parsed.data);
                }
            }
        } catch { }
    }, [setTodos]);

    useEffect(() => {
        localStorage.setItem(
            "todos_v4",
            JSON.stringify({ data: todos })
        );
    }, [todos]);

    /* ========= filter ========= */

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

        pushHistory();

        const newTodos = [...todos];
        const [moved] = newTodos.splice(oldIndex, 1);
        newTodos.splice(newIndex, 0, moved);

        setTodos(newTodos);
    };

    const activeTodo = todos.find(t => t.id === activeId);

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

                <input
                    placeholder="search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                />

                <div className="flex justify-between text-sm">
                    <span>{remaining} items left</span>

                    <div className="flex gap-3">
                        <button onClick={undo}>undo</button>
                        <button onClick={redo}>redo</button>
                        <button onClick={clearCompleted}>clear completed</button>
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
                    {filteredTodos.map(todo => (
                        <TodoItem key={todo.id} {...todo} />
                    ))}
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