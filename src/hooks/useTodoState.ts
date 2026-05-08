"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type Priority = "low" | "medium" | "high";

export interface Todo {
    id: string;
    text: string;
    normalized: string;
    completed: boolean;
    pinned: boolean;
    priority: Priority;
    createdAt: number;
    updatedAt: number;
}

export type FilterType =
    | "all"
    | "active"
    | "completed";

export type SortType =
    | "latest"
    | "oldest"
    | "priority";

type RemovedItem = {
    todo: Todo;
    index: number;
};

type Action =
    | {
        type: "replace";
        previous: Todo[];
        next: Todo[];
    }
    | {
        type: "add";
        todo: Todo;
    }
    | {
        type: "delete";
        removed: RemovedItem[];
    };

const STORAGE_KEY = "donezo-todos-v8";
const FILTER_KEY = "donezo-filter";
const SEARCH_KEY = "donezo-search";
const SORT_KEY = "donezo-sort";

const MAX_HISTORY = 50;

const now = () => Date.now();

const normalizeText = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

const priorityRank: Record<
    Priority,
    number
> = {
    high: 3,
    medium: 2,
    low: 1,
};

const load = <T,>(
    key: string,
    fallback: T
): T => {
    if (typeof window === "undefined") {
        return fallback;
    }

    try {
        const value = localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;
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
                action.removed.map(
                    (item) => item.todo.id
                )
            );

            return todos.filter(
                (todo) => !ids.has(todo.id)
            );
        }

        case "replace":
            return action.next;

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
                (todo) =>
                    todo.id !== action.todo.id
            );

        case "delete": {
            const restored = [...todos];

            [...action.removed]
                .sort(
                    (a, b) =>
                        a.index - b.index
                )
                .forEach(
                    ({ todo, index }) => {
                        restored.splice(
                            index,
                            0,
                            todo
                        );
                    }
                );

            return restored;
        }

        case "replace":
            return action.previous;

        default:
            return todos;
    }
};

export function useTodoState(
    initialTodos: Todo[] = []
) {
    const [todos, setTodos] = useState<Todo[]>(
        () =>
            load(
                STORAGE_KEY,
                initialTodos
            )
    );

    const [filter, setFilter] =
        useState<FilterType>(() =>
            load(FILTER_KEY, "all")
        );

    const [search, setSearch] =
        useState<string>(() =>
            load(SEARCH_KEY, "")
        );

    const [sort, setSort] =
        useState<SortType>(() =>
            load(SORT_KEY, "latest")
        );

    const undoStack = useRef<Action[]>(
        []
    );

    const redoStack = useRef<Action[]>(
        []
    );

    const normalizedSearch = useMemo(
        () => normalizeText(search),
        [search]
    );

    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(todos)
        );
    }, [todos]);

    useEffect(() => {
        localStorage.setItem(
            FILTER_KEY,
            JSON.stringify(filter)
        );
    }, [filter]);

    useEffect(() => {
        localStorage.setItem(
            SEARCH_KEY,
            JSON.stringify(search)
        );
    }, [search]);

    useEffect(() => {
        localStorage.setItem(
            SORT_KEY,
            JSON.stringify(sort)
        );
    }, [sort]);

    const pushHistory = useCallback(
        (action: Action) => {
            undoStack.current.push(action);

            if (
                undoStack.current.length >
                MAX_HISTORY
            ) {
                undoStack.current.shift();
            }

            redoStack.current = [];
        },
        []
    );

    const commit = useCallback(
        (action: Action) => {
            setTodos((prev) =>
                applyAction(prev, action)
            );

            pushHistory(action);
        },
        [pushHistory]
    );

    const patchTodo = useCallback(
        (
            id: string,
            updater: (
                todo: Todo
            ) => Todo
        ) => {
            const target = todos.find(
                (todo) => todo.id === id
            );

            if (!target) {
                return;
            }

            const next = todos.map((todo) =>
                todo.id === id
                    ? updater(todo)
                    : todo
            );

            commit({
                type: "replace",
                previous: todos,
                next,
            });
        },
        [todos, commit]
    );

    const addTodo = useCallback(
        (text: string) => {
            const value = text.trim();

            if (!value) {
                return;
            }

            const normalized =
                normalizeText(value);

            const exists = todos.some(
                (todo) =>
                    todo.normalized ===
                    normalized
            );

            if (exists) {
                return;
            }

            const timestamp = now();

            commit({
                type: "add",
                todo: {
                    id: crypto.randomUUID(),
                    text: value,
                    normalized,
                    completed: false,
                    pinned: false,
                    priority: "medium",
                    createdAt: timestamp,
                    updatedAt: timestamp,
                },
            });
        },
        [todos, commit]
    );

    const toggleTodo = useCallback(
        (id: string) => {
            patchTodo(id, (todo) => ({
                ...todo,
                completed:
                    !todo.completed,
                updatedAt: now(),
            }));
        },
        [patchTodo]
    );

    const togglePinned = useCallback(
        (id: string) => {
            patchTodo(id, (todo) => ({
                ...todo,
                pinned: !todo.pinned,
                updatedAt: now(),
            }));
        },
        [patchTodo]
    );

    const setPriority = useCallback(
        (
            id: string,
            priority: Priority
        ) => {
            patchTodo(id, (todo) => ({
                ...todo,
                priority,
                updatedAt: now(),
            }));
        },
        [patchTodo]
    );

    const editTodo = useCallback(
        (id: string, text: string) => {
            const value = text.trim();

            if (!value) {
                return;
            }

            const normalized =
                normalizeText(value);

            const duplicated =
                todos.some(
                    (todo) =>
                        todo.id !== id &&
                        todo.normalized ===
                        normalized
                );

            if (duplicated) {
                return;
            }

            patchTodo(id, (todo) => ({
                ...todo,
                text: value,
                normalized,
                updatedAt: now(),
            }));
        },
        [todos, patchTodo]
    );

    const deleteTodo = useCallback(
        (id: string) => {
            const index = todos.findIndex(
                (todo) => todo.id === id
            );

            if (index === -1) {
                return;
            }

            commit({
                type: "delete",
                removed: [
                    {
                        todo: todos[index],
                        index,
                    },
                ],
            });
        },
        [todos, commit]
    );

    const clearCompleted =
        useCallback(() => {
            const removed = todos
                .map((todo, index) => ({
                    todo,
                    index,
                }))
                .filter(
                    (item) =>
                        item.todo.completed
                );

            if (!removed.length) {
                return;
            }

            commit({
                type: "delete",
                removed,
            });
        }, [todos, commit]);

    const toggleAll = useCallback(() => {
        const shouldComplete =
            todos.some(
                (todo) =>
                    !todo.completed
            );

        const next = todos.map((todo) => ({
            ...todo,
            completed: shouldComplete,
            updatedAt: now(),
        }));

        commit({
            type: "replace",
            previous: todos,
            next,
        });
    }, [todos, commit]);

    const undo = useCallback(() => {
        const action =
            undoStack.current.pop();

        if (!action) {
            return;
        }

        setTodos((prev) =>
            revertAction(prev, action)
        );

        redoStack.current.push(action);
    }, []);

    const redo = useCallback(() => {
        const action =
            redoStack.current.pop();

        if (!action) {
            return;
        }

        setTodos((prev) =>
            applyAction(prev, action)
        );

        undoStack.current.push(action);
    }, []);

    const filteredTodos = useMemo(() => {
        const filtered = todos.filter(
            (todo) => {
                if (
                    !todo.normalized.includes(
                        normalizedSearch
                    )
                ) {
                    return false;
                }

                if (
                    filter ===
                    "completed"
                ) {
                    return todo.completed;
                }

                if (
                    filter === "active"
                ) {
                    return !todo.completed;
                }

                return true;
            }
        );

        return [...filtered].sort(
            (a, b) => {
                if (
                    a.pinned !== b.pinned
                ) {
                    return Number(
                        b.pinned
                    ) - Number(a.pinned);
                }

                if (
                    sort === "priority"
                ) {
                    return (
                        priorityRank[
                        b.priority
                        ] -
                        priorityRank[
                        a.priority
                        ]
                    );
                }

                if (
                    sort === "oldest"
                ) {
                    return (
                        a.createdAt -
                        b.createdAt
                    );
                }

                return (
                    b.updatedAt -
                    a.updatedAt
                );
            }
        );
    }, [
        todos,
        filter,
        sort,
        normalizedSearch,
    ]);

    const stats = useMemo(() => {
        const completed =
            todos.filter(
                (todo) =>
                    todo.completed
            ).length;

        return {
            total: todos.length,
            completed,
            active:
                todos.length - completed,
        };
    }, [todos]);

    return {
        todos,
        filteredTodos,
        stats,

        filter,
        setFilter,

        sort,
        setSort,

        search,
        setSearch,

        addTodo,
        toggleTodo,
        togglePinned,
        setPriority,
        editTodo,
        deleteTodo,
        clearCompleted,
        toggleAll,

        undo,
        redo,

        canUndo:
            undoStack.current.length >
            0,

        canRedo:
            redoStack.current.length >
            0,
    };
}