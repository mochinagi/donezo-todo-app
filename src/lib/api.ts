"use client";

/* ================= TYPES ================= */

export type Todo = {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
};

type ApiResponse<T> = {
    data: T;
    message?: string;
};

type RequestOptions = RequestInit & {
    retry?: number;
    timeout?: number;
    skipErrorHandler?: boolean;
    cache?: boolean;
};

/* ================= CONFIG ================= */

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const BASE_URL = "/api";
const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRY = 2;

/* ================= ERROR ================= */

export class APIError extends Error {
    status: number;
    original?: unknown;

    constructor(message: string, status: number, original?: unknown) {
        super(message);
        this.status = status;
        this.original = original;
    }
}

/* ================= MOCK ================= */

class MockDB {
    private todos: Todo[] = [
        {
            id: crypto.randomUUID(),
            text: "Mock Task",
            completed: false,
            createdAt: Date.now(),
        },
    ];

    getAll() {
        return [...this.todos].sort((a, b) => b.createdAt - a.createdAt);
    }

    add(text: string) {
        const todo: Todo = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            createdAt: Date.now(),
        };
        this.todos.unshift(todo);
        return todo;
    }

    update(id: string, updates: Partial<Omit<Todo, "id">>) {
        this.todos = this.todos.map(t =>
            t.id === id ? { ...t, ...updates } : t
        );
        return this.todos.find(t => t.id === id)!;
    }

    delete(id: string) {
        this.todos = this.todos.filter(t => t.id !== id);
    }
}

const mockDB = new MockDB();

/* ================= INTERNAL ================= */

const delay = (ms: number) =>
    new Promise(res => setTimeout(res, ms));

const safeJson = async (res: Response) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

const cacheMap = new Map<string, any>();
const inflightMap = new Map<string, Promise<any>>();

const shouldRetry = (err: any) => {
    if (err instanceof APIError) {
        return err.status >= 500;
    }
    return true;
};

/* ================= CORE ================= */

async function request<T>(
    url: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        retry = DEFAULT_RETRY,
        timeout = DEFAULT_TIMEOUT,
        cache = false,
        skipErrorHandler = false,
        ...fetchOptions
    } = options;

    const key = url + JSON.stringify(fetchOptions);

    // cache
    if (cache && cacheMap.has(key)) {
        return cacheMap.get(key);
    }

    // dedupe
    if (inflightMap.has(key)) {
        return inflightMap.get(key);
    }

    const task = (async () => {
        let attempt = 0;

        while (true) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);

            try {
                const res = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal,
                    headers: {
                        "Content-Type": "application/json",
                        ...(fetchOptions.headers || {}),
                    },
                });

                const json: ApiResponse<T> | null = await safeJson(res);

                if (!res.ok) {
                    throw new APIError(
                        json?.message || "Request failed",
                        res.status,
                        json
                    );
                }

                const data = json?.data as T;

                if (cache) cacheMap.set(key, data);

                return data;
            } catch (err: any) {
                const canRetry =
                    attempt < retry && shouldRetry(err);

                if (!canRetry) {
                    if (!skipErrorHandler) {
                        // 这里可以接 toaster
                        // toast.error(...)
                    }

                    if (err instanceof APIError) throw err;

                    throw new APIError(
                        err?.message || "Network error",
                        500,
                        err
                    );
                }

                attempt++;
                await delay(300 * attempt); // backoff
            } finally {
                clearTimeout(timer);
            }
        }
    })();

    inflightMap.set(key, task);

    try {
        return await task;
    } finally {
        inflightMap.delete(key);
    }
}

/* ================= API ================= */

export const fetchTodos = async (): Promise<Todo[]> => {
    if (USE_MOCK) {
        await delay(200);
        return mockDB.getAll();
    }

    return request<Todo[]>(`${BASE_URL}/todos`, {
        cache: true,
    });
};

export const addTodo = async (text: string): Promise<Todo> => {
    if (USE_MOCK) {
        await delay(200);
        return mockDB.add(text);
    }

    return request<Todo>(`${BASE_URL}/todos`, {
        method: "POST",
        body: JSON.stringify({ text }),
    });
};

export const updateTodo = async (
    id: string,
    updates: Partial<Omit<Todo, "id">>
): Promise<Todo> => {
    if (USE_MOCK) {
        await delay(200);
        return mockDB.update(id, updates);
    }

    return request<Todo>(`${BASE_URL}/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    });
};

export const deleteTodo = async (id: string): Promise<void> => {
    if (USE_MOCK) {
        await delay(200);
        mockDB.delete(id);
        return;
    }

    await request<void>(`${BASE_URL}/todos/${id}`, {
        method: "DELETE",
    });
};