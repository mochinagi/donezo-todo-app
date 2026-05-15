"use client";

import { useCallback, useEffect, useMemo } from "react";

import {
    useFilteredTodos,
    useTodoStore,
} from "@/store/todoStore";

export function useTodoState() {
    const {
        todos,

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

        undo,
        redo,

        total,
        completed,
        active,

        undoStack,
        redoStack,
    } = useTodoStore((state) => ({
        todos: state.todos,

        search: state.search,
        setSearch: state.setSearch,

        activeCategory: state.activeCategory,
        setActiveCategory:
            state.setActiveCategory,

        addTodo: state.addTodo,
        toggleTodo: state.toggleTodo,
        togglePinned:
            state.togglePinned,
        updateTodoText:
            state.updateTodoText,
        deleteTodo: state.deleteTodo,
        clearCompleted:
            state.clearCompleted,

        undo: state.undo,
        redo: state.redo,

        total: state.total,
        completed: state.completed,
        active: state.active,

        undoStack: state.undoStack,
        redoStack: state.redoStack,
    }));

    const filteredTodos =
        useFilteredTodos();

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            const isModifierPressed =
                event.metaKey ||
                event.ctrlKey;

            if (!isModifierPressed) {
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

    const stats = useMemo(
        () => ({
            total,
            completed,
            active,
            completionRate:
                total === 0
                    ? 0
                    : Math.round(
                        (
                            completed /
                            total
                        ) * 100
                    ),
        }),
        [
            total,
            completed,
            active,
        ]
    );

    const remainingText =
        useMemo(() => {
            switch (active) {
                case 0:
                    return "All tasks completed";

                case 1:
                    return "1 task remaining";

                default:
                    return `${active} tasks remaining`;
            }
        }, [active]);

    const hasCompleted =
        completed > 0;

    const isEmpty =
        todos.length === 0;

    const isFilteredEmpty =
        filteredTodos.length === 0;

    const canUndo =
        undoStack.length > 0;

    const canRedo =
        redoStack.length > 0;

    const resetSearch =
        useCallback(() => {
            setSearch("");
        }, [setSearch]);

    return {
        todos,
        filteredTodos,

        search,
        setSearch,
        resetSearch,

        activeCategory,
        setActiveCategory,

        addTodo,
        toggleTodo,
        togglePinned,
        updateTodoText,
        deleteTodo,
        clearCompleted,

        undo,
        redo,

        canUndo,
        canRedo,

        stats,

        remainingText,

        hasCompleted,
        isEmpty,
        isFilteredEmpty,
    };
}