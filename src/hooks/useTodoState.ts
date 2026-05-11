"use client";

import {
    useCallback,
    useEffect,
    useMemo,
} from "react";

import {
    useFilteredTodos,
    useTodoStore,
} from "@/store/todoStore";

export function useTodoState() {
    const todos =
        useTodoStore(
            (state) => state.todos
        );

    const filteredTodos =
        useFilteredTodos();

    const search =
        useTodoStore(
            (state) => state.search
        );

    const setSearch =
        useTodoStore(
            (state) =>
                state.setSearch
        );

    const activeCategory =
        useTodoStore(
            (state) =>
                state.activeCategory
        );

    const setActiveCategory =
        useTodoStore(
            (state) =>
                state.setActiveCategory
        );

    const addTodo =
        useTodoStore(
            (state) =>
                state.addTodo
        );

    const toggleTodo =
        useTodoStore(
            (state) =>
                state.toggleTodo
        );

    const togglePinned =
        useTodoStore(
            (state) =>
                state.togglePinned
        );

    const updateTodoText =
        useTodoStore(
            (state) =>
                state.updateTodoText
        );

    const deleteTodo =
        useTodoStore(
            (state) =>
                state.deleteTodo
        );

    const clearCompleted =
        useTodoStore(
            (state) =>
                state.clearCompleted
        );

    const undo =
        useTodoStore(
            (state) =>
                state.undo
        );

    const redo =
        useTodoStore(
            (state) =>
                state.redo
        );

    const total =
        useTodoStore(
            (state) => state.total
        );

    const completed =
        useTodoStore(
            (state) =>
                state.completed
        );

    const active =
        useTodoStore(
            (state) => state.active
        );

    const canUndo =
        useTodoStore(
            (state) =>
                state.undoStack.length >
                0
        );

    const canRedo =
        useTodoStore(
            (state) =>
                state.redoStack.length >
                0
        );

    useEffect(() => {
        const onKeyDown = (
            event: KeyboardEvent
        ) => {
            const modifier =
                event.metaKey ||
                event.ctrlKey;

            if (
                modifier &&
                event.key === "z" &&
                !event.shiftKey
            ) {
                event.preventDefault();

                undo();

                return;
            }

            if (
                modifier &&
                (
                    event.key === "y" ||
                    (
                        event.shiftKey &&
                        event.key === "Z"
                    )
                )
            ) {
                event.preventDefault();

                redo();
            }
        };

        window.addEventListener(
            "keydown",
            onKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                onKeyDown
            );
        };
    }, [undo, redo]);

    const stats = useMemo(
        () => ({
            total,
            completed,
            active,
        }),
        [
            total,
            completed,
            active,
        ]
    );

    const remainingText =
        useMemo(() => {
            if (active === 0) {
                return "All tasks completed";
            }

            if (active === 1) {
                return "1 task remaining";
            }

            return `${active} tasks remaining`;
        }, [active]);

    const hasCompleted =
        completed > 0;

    const isEmpty =
        todos.length === 0;

    const isFilteredEmpty =
        filteredTodos.length === 0;

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