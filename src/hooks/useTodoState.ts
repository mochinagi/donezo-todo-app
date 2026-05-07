"use client";

import {
    useState,
    useCallback,
    useMemo,
    useEffect,
    useRef,
} from "react";

export interface Todo {
    id: string;
    text: string;
    normalized: string;
    completed: boolean;
    createdAt: number;
    updatedAt: number;
}

export type FilterType = "all" | "completed" | "active";

type RemovedItem = {
    todo: Todo;
    index: number;
};

type Action =
    | { type: "add"; todo: Todo }
    | { type: "delete"; removed: RemovedItem[] }
    | { type: "update"; before: Todo; after: Todo }
    | { type: "toggle-all"; before: Todo[]; after: Todo[] };

const STORAGE_KEY = "donezo-todos-v7";
const FILTER_KEY = "donezo-filter";
const SEARCH_KEY = "donezo-search";

const MAX_HISTORY = 50;

const normalizeText = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

const now = () => Date.now();

const load = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") {
        return fallback;
    }

    try {
        const raw = localStorage.getItem(key);

        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const applyAction = (
    todos: Todo[],
    action: Action
): Todo[] => {
    switch (action.type) {
        case "add":
            return [action.todo, ...todos];

        case "delete": {
            const ids = new Set(
                action.removed.map((item) => item.todo.id)
            );

            return todos.filter((todo) => !ids.has(todo.id));
        }

        case "update":
            return todos.map((todo) =>
                todo.id === action.after.id
                    ? action.after
                    : todo
            );

        case "toggle-all":
            return action.after;

        default:
            return todos;
    }
};

const revertAction = (
    todos: Todo[],
    action: Action
): Todo[] => {
    switch (action.type) {
        case "add":
            return todos.filter(
                (todo) => todo.id !== action.todo.id
            );

        case "delete": {
            const restored = [...todos];

            [...action.removed]
                .sort((a, b) => a.index - b.index)
                .forEach(({ todo, index }) => {
                    restored.splice(index, 0, todo);
                });

            return restored;
        }

        case "update":
            return todos.map((todo) =>
                todo.id === action.before.id
                    ? action.before
                    : todo
            );

        case "toggle-all":
            return action.before;

        default:
            return todos;
    }
};

export function useTodoState(
    initialTodos: Todo[] = []
) {
    const [todos, setTodos] = useState<Todo[]>(() =>
        load(STORAGE_KEY, initialTodos)
    );

    const [filter, setFilter] = useState<FilterType>(
        () => load(FILTER_KEY, "all")
    );

    const [search, setSearch] = useState<string>(() =>
        load(SEARCH_KEY, "")
    );

    const undoStack = useRef<Action[]>([]);
    const redoStack = useRef<Action[]>([]);

    const persistTimer = useRef<
        ReturnType<typeof setTimeout> | undefined
    >(undefined);

    const normalizedSearch = useMemo(
        () => normalizeText(search),
        [search]
    );

    useEffect(() => {
        if (persistTimer.current) {
            clearTimeout(persistTimer.current);
        }

        persistTimer.current = setTimeout(() => {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(todos)
            );
        }, 150);

        return () => {
            if (persistTimer.current) {
                clearTimeout(persistTimer.current);
            }
        };
    }, [todos]);

    useEffect(() => {
        localStorage.setItem(FILTER_KEY, filter);
    }, [filter]);

    useEffect(() => {
        localStorage.setItem(SEARCH_KEY, search);
    }, [search]);

    const pushHistory = useCallback((action: Action) => {
        undoStack.current.push(action);

        if (undoStack.current.length > MAX_HISTORY) {
            undoStack.current.shift();
        }

        redoStack.current = [];
    }, []);

    const dispatch = useCallback(
        (action: Action) => {
            setTodos((prev) => applyAction(prev, action));

            pushHistory(action);
        },
        [pushHistory]
    );

    const addTodo = useCallback(
        (text: string) => {
            const value = text.trim();

            if (!value) {
                return;
            }

            const normalized = normalizeText(value);

            const duplicated = todos.some(
                (todo) => todo.normalized === normalized
            );

            if (duplicated) {
                return;
            }

            const timestamp = now();

            const todo: Todo = {
                id: crypto.randomUUID(),
                text: value,
                normalized,
                completed: false,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            dispatch({
                type: "add",
                todo,
            });
        },
        [todos, dispatch]
    );

    const toggleTodo = useCallback(
        (id: string) => {
            const target = todos.find(
                (todo) => todo.id === id
            );

            if (!target) {
                return;
            }

            dispatch({
                type: "update",
                before: target,
                after: {
                    ...target,
                    completed: !target.completed,
                    updatedAt: now(),
                },
            });
        },
        [todos, dispatch]
    );

    const editTodo = useCallback(
        (id: string, text: string) => {
            const value = text.trim();

            if (!value) {
                return;
            }

            const target = todos.find(
                (todo) => todo.id === id
            );

            if (!target) {
                return;
            }

            const normalized = normalizeText(value);

            const duplicated = todos.some(
                (todo) =>
                    todo.id !== id &&
                    todo.normalized === normalized
            );

            if (duplicated) {
                return;
            }

            const updated: Todo = {
                ...target,
                text: value,
                normalized,
                updatedAt: now(),
            };

            dispatch({
                type: "update",
                before: target,
                after: updated,
            });
        },
        [todos, dispatch]
    );

    const deleteTodo = useCallback(
        (id: string) => {
            const index = todos.findIndex(
                (todo) => todo.id === id
            );

            if (index === -1) {
                return;
            }

            dispatch({
                type: "delete",
                removed: [
                    {
                        todo: todos[index],
                        index,
                    },
                ],
            });
        },
        [todos, dispatch]
    );

    const clearCompleted = useCallback(() => {
        const removed = todos
            .map((todo, index) => ({
                todo,
                index,
            }))
            .filter((item) => item.todo.completed);

        if (!removed.length) {
            return;
        }

        dispatch({
            type: "delete",
            removed,
        });
    }, [todos, dispatch]);

    const toggleAll = useCallback(() => {
        const shouldComplete = todos.some(
            (todo) => !todo.completed
        );

        const nextTodos = todos.map((todo) => ({
            ...todo,
            completed: shouldComplete,
            updatedAt: now(),
        }));

        dispatch({
            type: "toggle-all",
            before: todos,
            after: nextTodos,
        });
    }, [todos, dispatch]);

    const undo = useCallback(() => {
        const action = undoStack.current.pop();

        if (!action) {
            return;
        }

        setTodos((prev) =>
            revertAction(prev, action)
        );

        redoStack.current.push(action);
    }, []);

    const redo = useCallback(() => {
        const action = redoStack.current.pop();

        if (!action) {
            return;
        }

        setTodos((prev) =>
            applyAction(prev, action)
        );

        undoStack.current.push(action);
    }, []);

    const filteredTodos = useMemo(() => {
        return todos.filter((todo) => {
            if (
                !todo.normalized.includes(
                    normalizedSearch
                )
            ) {
                return false;
            }

            if (filter === "completed") {
                return todo.completed;
            }

            if (filter === "active") {
                return !todo.completed;
            }

            return true;
        });
    }, [todos, filter, normalizedSearch]);

    const stats = useMemo(() => {
        const total = todos.length;

        const completed = todos.filter(
            (todo) => todo.completed
        ).length;

        return {
            total,
            completed,
            active: total - completed,
        };
    }, [todos]);

    return {
        todos,
        filteredTodos,
        stats,

        filter,
        setFilter,

        search,
        setSearch,

        addTodo,
        toggleTodo,
        editTodo,
        deleteTodo,
        clearCompleted,
        toggleAll,

        undo,
        redo,

        canUndo: undoStack.current.length > 0,
        canRedo: redoStack.current.length > 0,
    };
}