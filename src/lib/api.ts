/* ================= TYPES ================= */

export type Todo = {
    id: number;
    text: string;
    completed: boolean;
};

/* ================= CONFIG ================= */

const USE_MOCK = true;
const BASE_URL = "/api";

/* ================= UTILS ================= */

const delay = (ms: number) =>
    new Promise((res) => setTimeout(res, ms));

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "API Error");
    }
    return res.json();
};

/* ================= API ================= */

// GET
export const fetchTodos = async (): Promise<Todo[]> => {
    if (USE_MOCK) {
        await delay(500);

        return [
            { id: 1, text: "Mock Task", completed: false },
            { id: 2, text: "Learn Zustand", completed: true },
        ];
    }

    const res = await fetch(`${BASE_URL}/todos`);
    return handleResponse(res);
};

// POST
export const addTodo = async (text: string): Promise<Todo> => {
    if (USE_MOCK) {
        await delay(300);

        return {
            id: Date.now(),
            text,
            completed: false,
        };
    }

    const res = await fetch(`${BASE_URL}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    });

    return handleResponse(res);
};

// PATCH
export const updateTodo = async (
    id: number,
    updates: Partial<Omit<Todo, "id">>
): Promise<Todo> => {
    if (USE_MOCK) {
        await delay(300);

        return {
            id,
            text: updates.text ?? "Updated Task",
            completed: updates.completed ?? false,
        };
    }

    const res = await fetch(`${BASE_URL}/todos/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
    });

    return handleResponse(res);
};

// DELETE
export const deleteTodo = async (id: number): Promise<void> => {
    if (USE_MOCK) {
        await delay(300);
        return;
    }

    const res = await fetch(`${BASE_URL}/todos/${id}`, {
        method: "DELETE",
    });

    await handleResponse(res);
};