"use client";

import { Toaster, toast as sonnerToast, type ToastT } from "sonner";

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

type ToastOptions = {
    description?: string;
    id?: string;
    duration?: number;
};

const activeToasts = new Set<string>();

const create = (
    type: "success" | "error" | "info" | "loading",
    message: string,
    opts?: ToastOptions
) => {
    const id = opts?.id;

    if (id && activeToasts.has(id)) return id;

    if (id) activeToasts.add(id);

    const t =
        type === "success"
            ? sonnerToast.success(message, opts)
            : type === "error"
                ? sonnerToast.error(message, opts)
                : type === "loading"
                    ? sonnerToast.loading(message, opts)
                    : sonnerToast(message, opts);

    return t;
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
        if (id && typeof id === "string") {
            activeToasts.delete(id);
        }
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

    promise: async <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((err: any) => string);
        }
    ) => {
        return sonnerToast.promise(
            promise,
            {
                loading: messages.loading,
                success: (data) =>
                    typeof messages.success === "function"
                        ? messages.success(data)
                        : messages.success,
                error: (err) =>
                    typeof messages.error === "function"
                        ? messages.error(err)
                        : messages.error ?? err?.message ?? "error",
            }
        );
    },

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
};