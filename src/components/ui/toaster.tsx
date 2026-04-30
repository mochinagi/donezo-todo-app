"use client";

import { Toaster, toast as sonnerToast } from "sonner";

/* ================= TOASTER ================= */

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
};

/* ================= INTERNAL ================= */

const activeToasts = new Map<string, number>();

const THROTTLE = 800;
const TTL = 5000;

const handlers = {
    success: sonnerToast.success,
    error: sonnerToast.error,
    info: sonnerToast,
    loading: sonnerToast.loading,
};

const now = () => Date.now();

const makeKey = (type: ToastType, message: string, id?: string) =>
    id ?? `${type}:${message}`;

const shouldBlock = (key: string) => {
    const last = activeToasts.get(key);
    if (!last) return false;
    return now() - last < THROTTLE;
};

const mark = (key: string) => {
    activeToasts.set(key, now());

    // TTL cleanup 防止泄漏
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
    const { id, silent, ...rest } = opts || {};

    if (silent) return;

    const key = makeKey(type, message, id);

    if (shouldBlock(key)) return id;

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
    success: (message: string, description?: string, opts?: ToastOptions) =>
        create("success", message, { ...opts, description }),

    error: (message: string, description?: string, opts?: ToastOptions) =>
        create("error", message, { ...opts, description }),

    info: (message: string, description?: string, opts?: ToastOptions) =>
        create("info", message, { ...opts, description }),

    loading: (message: string, opts?: ToastOptions) =>
        create("loading", message, opts),

    dismiss: (id?: string | number) => {
        sonnerToast.dismiss(id);
    },

    update: (
        id: string | number,
        message: string,
        type: ToastType = "info",
        opts?: ToastOptions
    ) => {
        const handler = handlers[type];
        return handler(message, {
            id,
            ...opts,
        });
    },

    /* ===== promise ===== */
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

        if (shouldBlock(key)) return;

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

    /* ===== action ===== */
    action: (
        message: string,
        label: string,
        onClick: () => void,
        opts?: ToastOptions
    ) =>
        create("info", message, {
            ...opts,
            action: {
                label,
                onClick,
            },
        }),

    /* ===== task helper ===== */
    createTask: (message: string, opts?: ToastOptions) => {
        const id = opts?.id ?? crypto.randomUUID();
        let finished = false;

        create("loading", message, { ...opts, id });

        return {
            success: (msg: string) => {
                if (finished) return;
                finished = true;
                toast.update(id, msg, "success", opts);
            },
            error: (msg: string) => {
                if (finished) return;
                finished = true;
                toast.update(id, msg, "error", opts);
            },
            dismiss: () => {
                finished = true;
                toast.dismiss(id);
            },
            id,
        };
    },
};