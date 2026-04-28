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

const activeToasts = new Map<string, number>(); // id -> timestamp

const THROTTLE = 800;

const handlers = {
    success: sonnerToast.success,
    error: sonnerToast.error,
    info: sonnerToast,
    loading: sonnerToast.loading,
};

const now = () => Date.now();

const shouldBlock = (id?: string) => {
    if (!id) return false;

    const last = activeToasts.get(id);
    if (!last) return false;

    return now() - last < THROTTLE;
};

const mark = (id?: string) => {
    if (id) activeToasts.set(id, now());
};

const cleanup = (id?: string | number) => {
    if (typeof id === "string") {
        activeToasts.delete(id);
    }
};

/* ================= CORE ================= */

const create = (
    type: ToastType,
    message: string,
    opts?: ToastOptions
) => {
    const { id, silent, ...rest } = opts || {};

    if (silent) return;

    if (shouldBlock(id)) return id;

    mark(id);

    const handler = handlers[type];

    const toastId = handler(message, {
        ...rest,
        id,
        onDismiss: () => cleanup(id),
        onAutoClose: () => cleanup(id),
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
        cleanup(id);
        sonnerToast.dismiss(id);
    },

    update: (
        id: string | number,
        message: string,
        opts?: ToastOptions
    ) => {
        cleanup(id);
        return sonnerToast(message, {
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

        if (shouldBlock(id)) return;

        mark(id);

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
            onDismiss: () => cleanup(id),
            onAutoClose: () => cleanup(id),
        });
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
                onClick: () => {
                    onClick();
                    if (opts?.id) cleanup(opts.id);
                },
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
                toast.update(id, msg, opts);
            },
            error: (msg: string) => {
                if (finished) return;
                finished = true;
                toast.update(id, msg, opts);
            },
            dismiss: () => {
                finished = true;
                toast.dismiss(id);
            },
            id,
        };
    },
};