"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
    ThemeProvider as NextThemesProvider,
    useTheme,
} from "next-themes";

export type AppTheme = "light" | "dark" | "system";

type ThemeProviderProps = {
    children: ReactNode;
};

const STORAGE_KEY = "donezo-theme";

const themeOrder: AppTheme[] = ["light", "dark", "system"];

export function ThemeProvider({
    children,
}: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey={STORAGE_KEY}
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

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme: AppTheme =
        theme === "light" ||
            theme === "dark" ||
            theme === "system"
            ? theme
            : "system";

    const resolvedThemeValue =
        resolvedTheme === "dark"
            ? "dark"
            : "light";

    const systemThemeValue =
        systemTheme === "dark"
            ? "dark"
            : "light";

    useEffect(() => {
        if (!mounted) {
            return;
        }

        document.documentElement.dataset.theme =
            resolvedThemeValue;

        document.documentElement.style.colorScheme =
            resolvedThemeValue;
    }, [mounted, resolvedThemeValue]);

    useEffect(() => {
        const handleStorageChange = (
            event: StorageEvent
        ) => {
            if (
                event.key !== STORAGE_KEY ||
                !event.newValue
            ) {
                return;
            }

            if (
                event.newValue === "light" ||
                event.newValue === "dark" ||
                event.newValue === "system"
            ) {
                setTheme(event.newValue);
            }
        };

        window.addEventListener(
            "storage",
            handleStorageChange
        );

        return () => {
            window.removeEventListener(
                "storage",
                handleStorageChange
            );
        };
    }, [setTheme]);

    const setAppTheme = (value: AppTheme) => {
        document.documentElement.classList.add(
            "[&_*]:!transition-none"
        );

        setTheme(value);

        window.requestAnimationFrame(() => {
            document.documentElement.classList.remove(
                "[&_*]:!transition-none"
            );
        });
    };

    const toggleTheme = () => {
        setAppTheme(
            resolvedThemeValue === "dark"
                ? "light"
                : "dark"
        );
    };

    const cycleTheme = () => {
        const currentIndex =
            themeOrder.indexOf(currentTheme);

        const nextTheme =
            themeOrder[
            (currentIndex + 1) %
            themeOrder.length
            ];

        setAppTheme(nextTheme);
    };

    return {
        mounted,

        theme: currentTheme,

        resolvedTheme:
            resolvedThemeValue,

        systemTheme:
            systemThemeValue,

        nextTheme:
            themeOrder[
            (themeOrder.indexOf(
                currentTheme
            ) +
                1) %
            themeOrder.length
            ],

        isDark:
            mounted &&
            resolvedThemeValue ===
            "dark",

        isLight:
            mounted &&
            resolvedThemeValue ===
            "light",

        isSystem:
            mounted &&
            currentTheme ===
            "system",

        setTheme: setAppTheme,

        toggleTheme,

        cycleTheme,
    };
}