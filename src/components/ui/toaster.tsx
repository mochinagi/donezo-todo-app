"use client";

import { Toaster, toast as sonnerToast } from "sonner";

type ToastOptions = {
    id?: string;
    description?: string;
    duration?: number;
    throttle?: number;
    silent?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
};

const DEFAULT_THROTTLE = 800;
const MAX_CACHE = 100;

class ToastRegistry {
    private map = new Map<string, number>();

    shouldSkip(key: string, throttle: number) {
        const last = this.map.get(key);
        if (!last) return false;
        return Date.now() - last < throttle;
    }

    remember(key: string) {
        if (this.map.size >= MAX_CACHE) {
            const first = this.map.keys().next().value;
            if (first) this.map.delete(first);
        }
        this.map.set(key, Date.now());
    }
}

const registry = new ToastRegistry();

const buildKey = (type: string, message: string, id?: string) =>
    id ?? `${type}:${message}`;

const baseToast = (
    type: "success" | "error" | "info" | "loading",
    message: string,
    options?: ToastOptions
) => {
    if (options?.silent) return;

    const key = buildKey(type, message, options?.id);
    const throttle = options?.throttle ?? DEFAULT_THROTTLE;

    if (registry.shouldSkip(key, throttle)) {
        return;
    }

    registry.remember(key);

    return sonnerToast[type](message, {
        description: options?.description,
        duration: options?.duration,
        id: options?.id,
        action: options?.action,
    });
};

export const toast = {
    success: (message: string, description?: string, options?: ToastOptions) =>
        baseToast("success", message, { ...options, description }),

    error: (message: string, description?: string, options?: ToastOptions) =>
        baseToast("error", message, { ...options, description }),

    info: (message: string, description?: string, options?: ToastOptions) =>
        baseToast("info", message, { ...options, description }),

    loading: (message: string, options?: ToastOptions) =>
        baseToast("loading", message, options),

    dismiss: (id?: string | number) => sonnerToast.dismiss(id),

    update: (
        id: string | number,
        message: string,
        type: "success" | "error" | "info" | "loading" = "info",
        options?: ToastOptions
    ) => {
        return sonnerToast[type](message, {
            id,
            description: options?.description,
            duration: options?.duration,
            action: options?.action,
        });
    },

    promise: async <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: unknown) => string);
        },
        options?: ToastOptions
    ) => {
        return sonnerToast.promise(promise, {
            loading: messages.loading,
            success: (data: T) =>
                typeof messages.success === "function"
                    ? messages.success(data)
                    : messages.success,

            error: (error: unknown) =>
                typeof messages.error === "function"
                    ? messages.error(error)
                    : messages.error || "error",

            id: options?.id,
            duration: options?.duration,
        });
    },

    action: (
        message: string,
        label: string,
        onClick: () => void,
        options?: ToastOptions
    ) =>
        baseToast("info", message, {
            ...options,
            action: { label, onClick },
        }),
};

export default function AppToaster() {
    return (
        <Toaster
            position="top-right"
            closeButton
            richColors
            expand
            visibleToasts={3}
            toastOptions={{
                duration: 3000,
                className: "text-sm",
            }}
        />
    );
}