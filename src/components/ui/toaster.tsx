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

/* ================= TOAST WRAPPER ================= */

export const toast = {
    success: (message: string, description?: string) =>
        sonnerToast.success(message, {
            description,
        }),

    error: (message: string, description?: string) =>
        sonnerToast.error(message, {
            description,
        }),

    info: (message: string, description?: string) =>
        sonnerToast(message, {
            description,
        }),

    loading: (message: string) =>
        sonnerToast.loading(message),

    promise: async <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return sonnerToast.promise(promise, messages);
    },

    action: (
        message: string,
        label: string,
        onClick: () => void
    ) =>
        sonnerToast(message, {
            action: {
                label,
                onClick,
            },
        }),
};