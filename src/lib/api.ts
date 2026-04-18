"use client";

/* ================= TYPES ================= */

export type Todo = {
    id: number;
    text: string;
    completed: boolean;
};

type ApiResponse<T> = {
    data: T;
    message?: string;
};

/* ================= CONFIG ================= */

const USE_MOCK = true;
const BASE_URL = "/api";
const TIMEOUT = 5000;

/* ================= ERROR ================= */

class APIError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

/* ================= UTILS ================= */

const delay = (ms: number) =>
    new Promise((res) => setTimeout(res, ms));

/* ================= MOCK ================= */

let mockTodos: Todo[] = [
    { id: 1, text: "Mock Task", completed: false },
    { id: 2, text: "Learn Zustand", completed: true },
];

/* ================= REQUEST ================= */

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

        let data: any = null;

        try {
            data = await res.json();
        } catch {
            // ignore JSON parse error
        }

        if (!res.ok) {
            throw new APIError(
                data?.message || "Request failed",
                res.status
            );
        }

        return data?.data ?? data;
    } catch (err: any) {
        if (err.name === "AbortError") {
            throw new APIError("Request timeout", 408);
        }

        throw err;
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
            id: Date.now(),
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
    id: number,
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
export const deleteTodo = async (id: number): Promise<void> => {
    if (USE_MOCK) {
        await delay(200);

        mockTodos = mockTodos.filter((t) => t.id !== id);
        return;
    }

    await request(`${BASE_URL}/todos/${id}`, {
        method: "DELETE",
    });
};