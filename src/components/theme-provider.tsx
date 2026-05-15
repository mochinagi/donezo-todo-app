"use client";

import {
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    ThemeProvider as NextThemesProvider,
    useTheme,
} from "next-themes";

export type AppTheme =
    | "light"
    | "dark"
    | "system";

type ResolvedTheme =
    | "light"
    | "dark";

type ThemeProviderProps = {
    children: ReactNode;
};

const STORAGE_KEY =
    "donezo-theme";

const THEME_ORDER: AppTheme[] =
    [
        "light",
        "dark",
        "system",
    ];

const resolveTheme = (
    value?: string
): ResolvedTheme => {
    return value === "dark"
        ? "dark"
        : "light";
};

const isAppTheme = (
    value?: string | null
): value is AppTheme => {
    return THEME_ORDER.includes(
        value as AppTheme
    );
};

export function ThemeProvider({
    children,
}: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey={
                STORAGE_KEY
            }
        >
            {children}
        </NextThemesProvider>
    );
}

export function useAppTheme() {
    const {
        theme,
        setTheme,
        resolvedTheme,
        systemTheme,
    } = useTheme();

    const [mounted, setMounted] =
        useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme: AppTheme =
        isAppTheme(theme)
            ? theme
            : "system";

    const resolved =
        resolveTheme(
            resolvedTheme
        );

    const system =
        resolveTheme(
            systemTheme
        );

    useEffect(() => {
        if (!mounted) {
            return;
        }

        document.documentElement.dataset.theme =
            resolved;
    }, [
        mounted,
        resolved,
    ]);

    useEffect(() => {
        const syncTheme = (
            event: StorageEvent
        ) => {
            if (
                event.key !==
                STORAGE_KEY
            ) {
                return;
            }

            if (
                !isAppTheme(
                    event.newValue
                )
            ) {
                return;
            }

            setTheme(
                event.newValue
            );
        };

        window.addEventListener(
            "storage",
            syncTheme
        );

        return () => {
            window.removeEventListener(
                "storage",
                syncTheme
            );
        };
    }, [setTheme]);

    const nextTheme =
        useMemo(() => {
            const index =
                THEME_ORDER.indexOf(
                    currentTheme
                );

            return THEME_ORDER[
                (
                    index + 1
                ) %
                THEME_ORDER.length
            ];
        }, [currentTheme]);

    const setAppTheme = (
        value: AppTheme
    ) => {
        setTheme(value);
    };

    const toggleTheme = () => {
        setTheme(
            resolved === "dark"
                ? "light"
                : "dark"
        );
    };

    const cycleTheme = () => {
        setTheme(nextTheme);
    };

    return {
        mounted,

        theme:
            currentTheme,

        resolvedTheme:
            resolved,

        systemTheme:
            system,

        nextTheme,

        isDark:
            mounted &&
            resolved ===
            "dark",

        isLight:
            mounted &&
            resolved ===
            "light",

        isSystem:
            mounted &&
            currentTheme ===
            "system",

        setTheme:
            setAppTheme,

        toggleTheme,

        cycleTheme,
    };
}