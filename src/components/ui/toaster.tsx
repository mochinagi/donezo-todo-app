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

/* ================= INTERNAL ================= */

type ToastType = "success" | "error" | "info" | "loading";

type ToastOptions = {
    description?: string;
    id?: string;
    duration?: number;
};

const activeToasts = new Set<string>();

const handlers = {
    success: sonnerToast.success,
    error: sonnerToast.error,
    info: sonnerToast,
    loading: sonnerToast.loading,
};

const cleanup = (id?: string | number) => {
    if (typeof id === "string") {
        activeToasts.delete(id);
    }
};

const create = (
    type: ToastType,
    message: string,
    opts?: ToastOptions
) => {
    const id = opts?.id;

    if (id && activeToasts.has(id)) return id;

    if (id) activeToasts.add(id);

    const handler = handlers[type];

    const toastId = handler(message, {
        ...opts,
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
        return sonnerToast(message, {
            id,
            ...opts,
        });
    },

    /* ===== promise (improved) ===== */
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

        if (id && activeToasts.has(id)) return;

        if (id) activeToasts.add(id);

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
        sonnerToast(message, {
            ...opts,
            action: {
                label,
                onClick,
            },
        }),

    /* ===== loading task helper ===== */
    createTask: (message: string, opts?: ToastOptions) => {
        const id = opts?.id ?? crypto.randomUUID();

        toast.loading(message, { ...opts, id });

        return {
            success: (msg: string) =>
                toast.update(id, msg, { ...opts }),
            error: (msg: string) =>
                toast.update(id, msg, { ...opts }),
            dismiss: () => toast.dismiss(id),
            id,
        };
    },
};