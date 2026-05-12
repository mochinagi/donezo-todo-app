"use client";

import {
    ThemeProvider as NextThemesProvider,
    useTheme,
} from "next-themes";

import {
    useEffect,
    useState,
    type ReactNode,
} from "react";

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

const isValidTheme = (
    value: string
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
            storageKey={
                STORAGE_KEY
            }
            disableTransitionOnChange
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

    useEffect(() => {
        if (
            typeof window ===
            "undefined" ||
            !mounted
        ) {
            return;
        }

        const resolved =
            resolvedTheme === "dark"
                ? "dark"
                : "light";

        document.documentElement.dataset.theme =
            resolved;
    }, [
        mounted,
        resolvedTheme,
    ]);

    useEffect(() => {
        if (
            typeof window ===
            "undefined"
        ) {
            return;
        }

        const syncTheme = (
            event: StorageEvent
        ) => {
            if (
                event.key !==
                STORAGE_KEY ||
                !event.newValue ||
                !isValidTheme(
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

    const currentTheme: AppTheme =
        isValidTheme(
            theme ?? ""
        )
            ? theme
            : "system";

    const resolved: ResolvedTheme =
        resolvedTheme ===
            "dark"
            ? "dark"
            : "light";

    const system: ResolvedTheme =
        systemTheme ===
            "dark"
            ? "dark"
            : "light";

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
        if (
            currentTheme ===
            "light"
        ) {
            setTheme("dark");

            return;
        }

        if (
            currentTheme ===
            "dark"
        ) {
            setTheme("system");

            return;
        }

        setTheme("light");
    };

    const nextTheme =
        currentTheme ===
            "light"
            ? "dark"
            : currentTheme ===
                "dark"
                ? "system"
                : "light";

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