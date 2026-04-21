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

/* ================= ERROR ================= */

export class APIError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

/* ================= UTILS ================= */

const delay = (ms: number) =>
    new Promise((res) => setTimeout(res, ms));

const safeJson = async (res: Response) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

/* ================= MOCK ================= */

let mockTodos: Todo[] = [
    { id: crypto.randomUUID(), text: "Mock Task", completed: false },
    { id: crypto.randomUUID(), text: "Learn Zustand", completed: true },
];

/* ================= CORE REQUEST ================= */

async function request<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        const res = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...(options?.headers || {}),
            },
        });

        const json: ApiResponse<T> | null = await safeJson(res);

        if (!res.ok) {
            throw new APIError(
                json?.message || "Request failed",
                res.status
            );
        }

        return json?.data as T;
    } catch (err: any) {
        if (err.name === "AbortError") {
            throw new APIError("Request timeout", 408);
        }

        throw err instanceof APIError
            ? err
            : new APIError("Network error", 500);
    } finally {
        clearTimeout(timeout);
    }
}

/* ================= API ================= */

/* GET */
export const fetchTodos = async (): Promise<Todo[]> => {
    if (USE_MOCK) {
        await delay(300);
        return [...mockTodos];
    }

    return request<Todo[]>(`${BASE_URL}/todos`);
};

/* POST */
export const addTodo = async (text: string): Promise<Todo> => {
    if (USE_MOCK) {
        await delay(200);

        const newTodo: Todo = {
            id: crypto.randomUUID(),
            text,
            completed: false,
        };

        mockTodos.unshift(newTodo);
        return newTodo;
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

        mockTodos = mockTodos.map((t) =>
            t.id === id ? { ...t, ...updates } : t
        );

        return mockTodos.find((t) => t.id === id)!;
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

        mockTodos = mockTodos.filter((t) => t.id !== id);
        return;
    }

    await request<void>(`${BASE_URL}/todos/${id}`, {
        method: "DELETE",
    });
};