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

/* ================= STATE ================= */

const activeToasts = new Map<string, number>();

const MAX_ACTIVE = 100;
const DEFAULT_THROTTLE = 800;
const TTL = 5000;

/* ================= HANDLERS ================= */

const handlers: Record<ToastType, typeof sonnerToast> = {
    success: sonnerToast.success,
    error: sonnerToast.error,
    info: sonnerToast,
    loading: sonnerToast.loading,
};

const now = () => Date.now();

const makeKey = (type: ToastType, message: string, id?: string) =>
    id ?? `${type}:${message}`;

const shouldBlock = (key: string, throttle: number) => {
    const last = activeToasts.get(key);
    if (!last) return false;
    return now() - last < throttle;
};

const mark = (key: string) => {
    if (activeToasts.size > MAX_ACTIVE) {
        const first = activeToasts.keys().next().value;
        if (first) activeToasts.delete(first);
    }

    activeToasts.set(key, now());

    setTimeout(() => {
        const ts = activeToasts.get(key);
        if (ts && now() - ts >= TTL) {
            activeToasts.delete(key);
        }
    }, TTL);
};

const cleanup = (key: string) => {
    activeToasts.delete(key);
};

/* ================= CORE ================= */

const create = (
    type: ToastType,
    message: string,
    opts?: ToastOptions
) => {
    const { id, silent, throttle = DEFAULT_THROTTLE, ...rest } = opts || {};

    if (silent) return;

    const key = makeKey(type, message, id);

    if (shouldBlock(key, throttle)) return id;

    mark(key);

    const handler = handlers[type];

    const toastId = handler(message, {
        ...rest,
        id,
        onDismiss: () => cleanup(key),
        onAutoClose: () => cleanup(key),
    });

    return toastId;
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
        const handler = handlers[type];
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
        const id = opts?.id;
        const key = makeKey("loading", messages.loading, id);

        if (shouldBlock(key, opts?.throttle ?? DEFAULT_THROTTLE)) return;

        mark(key);

        try {
            return await sonnerToast.promise(promise, {
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
        } finally {
            cleanup(key);
        }
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
        let finished = false;

        create("loading", msg, { ...opts, id });

        return {
            success: (m: string) => {
                if (finished) return;
                finished = true;
                toast.update(id, m, "success", opts);
            },
            error: (m: string) => {
                if (finished) return;
                finished = true;
                toast.update(id, m, "error", opts);
            },
            dismiss: () => {
                finished = true;
                toast.dismiss(id);
            },
            id,
        };
    },
};