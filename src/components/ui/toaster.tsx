"use client";

import { Toaster, toast as sonnerToast } from "sonner";

/* ================= UI ================= */

export default function AppToaster() {
    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            expand
            visibleToasts={3}
            toastOptions={{
                duration: 3000,
                className: "text-sm",
            }}
        />
    );
}

/* ================= TYPES ================= */

type ToastType = "success" | "error" | "info" | "loading";

type ToastOptions = {
    description?: string;
    id?: string;
    duration?: number;
    silent?: boolean;
    throttle?: number;
};

/* ================= INTERNAL ================= */

const lastToastMap = new Map<string, number>();

const MAX_CACHE = 100;
const DEFAULT_THROTTLE = 800;

const now = () => Date.now();

const keyOf = (type: ToastType, message: string, id?: string) =>
    id ?? `${type}:${message}`;

const isThrottled = (key: string, throttle: number) => {
    const last = lastToastMap.get(key);
    return last ? now() - last < throttle : false;
};

const mark = (key: string) => {
    if (lastToastMap.size > MAX_CACHE) {
        const firstKey = lastToastMap.keys().next().value;
        if (firstKey) lastToastMap.delete(firstKey);
    }
    lastToastMap.set(key, now());
};

/* ================= CORE ================= */

const create = (
    type: ToastType,
    message: string,
    opts?: ToastOptions
) => {
    const { id, silent, throttle = DEFAULT_THROTTLE, ...rest } = opts || {};

    if (silent) return;

    const key = keyOf(type, message, id);

    if (isThrottled(key, throttle)) return id;

    mark(key);

    const handler = sonnerToast[type];

    return handler(message, {
        ...rest,
        id,
    });
};

/* ================= API ================= */

export const toast = {
    success: (msg: string, desc?: string, opts?: ToastOptions) =>
        create("success", msg, { ...opts, description: desc }),

    error: (msg: string, desc?: string, opts?: ToastOptions) =>
        create("error", msg, { ...opts, description: desc }),

    info: (msg: string, desc?: string, opts?: ToastOptions) =>
        create("info", msg, { ...opts, description: desc }),

    loading: (msg: string, opts?: ToastOptions) =>
        create("loading", msg, opts),

    dismiss: (id?: string | number) => {
        sonnerToast.dismiss(id);
    },

    update: (
        id: string | number,
        msg: string,
        type: ToastType = "info",
        opts?: ToastOptions
    ) => {
        const handler = sonnerToast[type];
        return handler(msg, { id, ...opts });
    },

    promise: async <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((err: any) => string);
        },
        opts?: ToastOptions
    ) => {
        return sonnerToast.promise(promise, {
            loading: messages.loading,
            success: (data) =>
                typeof messages.success === "function"
                    ? messages.success(data)
                    : messages.success,
            error: (err) =>
                typeof messages.error === "function"
                    ? messages.error(err)
                    : messages.error ?? err?.message ?? "error",
            ...opts,
        });
    },

    action: (
        msg: string,
        label: string,
        onClick: () => void,
        opts?: ToastOptions
    ) =>
        create("info", msg, {
            ...opts,
            action: { label, onClick },
        }),

    createTask: (msg: string, opts?: ToastOptions) => {
        const id = opts?.id ?? crypto.randomUUID();
        let done = false;

        create("loading", msg, { ...opts, id });

        return {
            success: (m: string) => {
                if (done) return;
                done = true;
                toast.update(id, m, "success", opts);
            },
            error: (m: string) => {
                if (done) return;
                done = true;
                toast.update(id, m, "error", opts);
            },
            dismiss: () => {
                done = true;
                toast.dismiss(id);
            },
            id,
        };
    },
};