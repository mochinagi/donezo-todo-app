"use client";

import { useEffect } from "react";

import {
    useFilteredTodos,
    useTodoStore,
} from "@/store/todoStore";

export function useTodoState() {
    const todos = useTodoStore(
        state => state.todos
    );

    const search = useTodoStore(
        state => state.search
    );

    const setSearch = useTodoStore(
        state => state.setSearch
    );

    const activeCategory = useTodoStore(
        state => state.activeCategory
    );

    const setActiveCategory =
        useTodoStore(
            state => state.setActiveCategory
        );

    const addTodo = useTodoStore(
        state => state.addTodo
    );

    const toggleTodo = useTodoStore(
        state => state.toggleTodo
    );

    const togglePinned = useTodoStore(
        state => state.togglePinned
    );

    const updateTodoText =
        useTodoStore(
            state => state.updateTodoText
        );

    const deleteTodo = useTodoStore(
        state => state.deleteTodo
    );

    const clearCompleted =
        useTodoStore(
            state => state.clearCompleted
        );

    const undo = useTodoStore(
        state => state.undo
    );

    const redo = useTodoStore(
        state => state.redo
    );

    const undoStack = useTodoStore(
        state => state.undoStack
    );

    const redoStack = useTodoStore(
        state => state.redoStack
    );

    const filteredTodos =
        useFilteredTodos();

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            const modifierPressed =
                event.metaKey ||
                event.ctrlKey;

            if (!modifierPressed) {
                return;
            }

            const key =
                event.key.toLowerCase();

            if (
                key === "z" &&
                !event.shiftKey
            ) {
                event.preventDefault();
                undo();

                return;
            }

            if (
                key === "y" ||
                (
                    key === "z" &&
                    event.shiftKey
                )
            ) {
                event.preventDefault();
                redo();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [undo, redo]);

    const sortedTodos = [
        ...filteredTodos,
    ].sort((a, b) => {
        if (
            a.pinned !== b.pinned
        ) {
            return a.pinned ? -1 : 1;
        }

        if (
            a.completed !==
            b.completed
        ) {
            return a.completed ? 1 : -1;
        }

        return (
            new Date(
                b.updatedAt ??
                b.createdAt
            ).getTime() -
            new Date(
                a.updatedAt ??
                a.createdAt
            ).getTime()
        );
    });

    const total = todos.length;

    const completed = todos.filter(
        todo => todo.completed
    ).length;

    const active =
        total - completed;

    const completionRate =
        total === 0
            ? 0
            : Math.round(
                (
                    completed /
                    total
                ) * 100
            );

    const remainingText =
        active === 0
            ? "All tasks completed"
            : active === 1
                ? "1 task remaining"
                : `${active} tasks remaining`;

    const pinnedTodos =
        sortedTodos.filter(
            todo => todo.pinned
        );

    const activeTodos =
        sortedTodos.filter(
            todo => !todo.completed
        );

    const completedTodos =
        sortedTodos.filter(
            todo => todo.completed
        );

    const completeAll = () => {
        activeTodos.forEach(todo => {
            toggleTodo(todo.id);
        });
    };

    return {
        todos,
        filteredTodos:
            sortedTodos,

        pinnedTodos,
        activeTodos,
        completedTodos,

        search,
        setSearch,

        activeCategory,
        setActiveCategory,

        addTodo,
        toggleTodo,
        togglePinned,
        updateTodoText,
        deleteTodo,

        clearCompleted,
        completeAll,

        undo,
        redo,

        canUndo:
            undoStack.length > 0,

        canRedo:
            redoStack.length > 0,

        stats: {
            total,
            completed,
            active,
            completionRate,
        },

        remainingText,

        hasCompleted:
            completed > 0,

        isEmpty:
            total === 0,

        isFilteredEmpty:
            sortedTodos.length === 0,
    };
}