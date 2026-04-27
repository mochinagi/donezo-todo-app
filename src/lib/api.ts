"use client";

/* ================= TYPES ================= */

export type Todo = {
    id: string;
    text: string;
    completed: boolean;
};

type ApiResponse<T> = {
    data: T;
    message?: string;
};

/* ================= CONFIG ================= */

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const BASE_URL = "/api";
const TIMEOUT = 5000;
const RETRY = 2;

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

/* ================= MOCK LAYER ================= */

class MockDB {
    private todos: Todo[] = [
        { id: crypto.randomUUID(), text: "Mock Task", completed: false },
        { id: crypto.randomUUID(), text: "Learn Zustand", completed: true },
    ];

    getAll() {
        return [...this.todos];
    }

    add(text: string) {
        const todo: Todo = {
            id: crypto.randomUUID(),
            text,
            completed: false,
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

    reset() {
        this.todos = [];
    }
}

const mockDB = new MockDB();

/* ================= UTILS ================= */

const delay = (ms: number) =>
    new Promise(res => setTimeout(res, ms));

const safeJson = async (res: Response) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

/* ================= CORE REQUEST ================= */

async function request<T>(
    url: string,
    options: RequestInit = {},
    retryCount = RETRY
): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        const res = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
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

        return json?.data as T;
    } catch (err: any) {
        if (err?.name === "AbortError") {
            throw new APIError("Request timeout", 408, err);
        }

        if (retryCount > 0) {
            return request<T>(url, options, retryCount - 1);
        }

        if (err instanceof APIError) throw err;

        throw new APIError("Network error", 500, err);
    } finally {
        clearTimeout(timeout);
    }
}

/* ================= API ================= */

/* GET */
export const fetchTodos = async (): Promise<Todo[]> => {
    if (USE_MOCK) {
        await delay(200);
        return mockDB.getAll();
    }

    return request<Todo[]>(`${BASE_URL}/todos`);
};

/* POST */
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

/* PATCH */
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

/* DELETE */
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

/* ================= DEV HELPERS ================= */

export const __mockReset = () => {
    if (USE_MOCK) mockDB.reset();
};