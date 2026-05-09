"use client";

import {
    Toaster,
    toast as sonnerToast,
} from "sonner";

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

const recentToastMap = new Map<
    string,
    number
>();

const DEFAULT_THROTTLE = 800;

const MAX_CACHE = 100;

const shouldSkip = (
    key: string,
    throttle: number
) => {
    const last =
        recentToastMap.get(key);

    if (!last) {
        return false;
    }

    return (
        Date.now() - last <
        throttle
    );
};

const rememberToast = (
    key: string
) => {
    if (
        recentToastMap.size >=
        MAX_CACHE
    ) {
        const first =
            recentToastMap.keys().next()
                .value;

        if (first) {
            recentToastMap.delete(
                first
            );
        }
    }

    recentToastMap.set(
        key,
        Date.now()
    );
};

const showToast = (
    type:
        | "success"
        | "error"
        | "info"
        | "loading",
    message: string,
    options?: ToastOptions
) => {
    if (options?.silent) {
        return;
    }

    const key =
        options?.id ??
        `${type}:${message}`;

    const throttle =
        options?.throttle ??
        DEFAULT_THROTTLE;

    if (
        shouldSkip(
            key,
            throttle
        )
    ) {
        return key;
    }

    rememberToast(key);

    return sonnerToast[type](
        message,
        {
            ...options,
        }
    );
};

export const toast = {
    success: (
        message: string,
        description?: string,
        options?: ToastOptions
    ) => {
        return showToast(
            "success",
            message,
            {
                ...options,
                description,
            }
        );
    },

    error: (
        message: string,
        description?: string,
        options?: ToastOptions
    ) => {
        return showToast(
            "error",
            message,
            {
                ...options,
                description,
            }
        );
    },

    info: (
        message: string,
        description?: string,
        options?: ToastOptions
    ) => {
        return showToast(
            "info",
            message,
            {
                ...options,
                description,
            }
        );
    },

    loading: (
        message: string,
        options?: ToastOptions
    ) => {
        return showToast(
            "loading",
            message,
            options
        );
    },

    dismiss: (
        id?: string | number
    ) => {
        sonnerToast.dismiss(id);
    },

    update: (
        id: string | number,
        message: string,
        type:
            | "success"
            | "error"
            | "info"
            | "loading" = "info",
        options?: ToastOptions
    ) => {
        return sonnerToast[type](
            message,
            {
                ...options,
                id,
            }
        );
    },

    promise: async <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success:
            | string
            | ((
                data: T
            ) => string);
            error:
            | string
            | ((
                error: unknown
            ) => string);
        },
        options?: ToastOptions
    ) => {
        return sonnerToast.promise(
            promise,
            {
                loading:
                    messages.loading,

                success: (data) => {
                    if (
                        typeof messages.success ===
                        "function"
                    ) {
                        return messages.success(
                            data
                        );
                    }

                    return messages.success;
                },

                error: (error) => {
                    if (
                        typeof messages.error ===
                        "function"
                    ) {
                        return messages.error(
                            error
                        );
                    }

                    return (
                        messages.error ||
                        "error"
                    );
                },

                ...options,
            }
        );
    },

    action: (
        message: string,
        label: string,
        onClick: () => void,
        options?: ToastOptions
    ) => {
        return showToast(
            "info",
            message,
            {
                ...options,
                action: {
                    label,
                    onClick,
                },
            }
        );
    },
};