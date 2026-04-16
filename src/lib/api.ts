export type Todo = {
    id: number;
    text: string;
    completed: boolean;
};

const USE_MOCK = true;
const BASE_URL = "/api";

const delay = (ms: number) =>
    new Promise((res) => setTimeout(res, ms));

/* mock data（带状态） */
let mockTodos: Todo[] = [
    { id: 1, text: "Mock Task", completed: false },
    { id: 2, text: "Learn Zustand", completed: true },
];

/* request 封装 */
async function request<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...(options?.headers || {}),
            },
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Request failed");
        }

        return res.json();
    } catch (err: any) {
        if (err.name === "AbortError") {
            throw new Error("Request timeout");
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

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

        const updated = mockTodos.find((t) => t.id === id)!;
        return updated;
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