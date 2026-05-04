"use client";

import {
    ThemeProvider as NextThemesProvider,
    useTheme,
} from "next-themes";
import {
    useEffect,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";

export type AppTheme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
    children: ReactNode;
};

const STORAGE_KEY = "donezo-theme";

export function ThemeProvider({ children }: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey={STORAGE_KEY}
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
}

export function useAppTheme() {
    const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme: AppTheme = (theme ?? "system") as AppTheme;

    const fallbackSystem = (() => {
        if (typeof window === "undefined") return "light";
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    })();

    const resolved: ResolvedTheme =
        mounted && resolvedTheme
            ? (resolvedTheme as ResolvedTheme)
            : fallbackSystem;

    const system: ResolvedTheme =
        mounted && systemTheme
            ? (systemTheme as ResolvedTheme)
            : fallbackSystem;

    const isDark = resolved === "dark";
    const isLight = resolved === "light";
    const isSystem = currentTheme === "system";

    const set = useCallback(
        (value: AppTheme) => {
            setTheme(value);
        },
        [setTheme]
    );

    const toggle = useCallback(() => {
        if (currentTheme === "system") {
            set(resolved === "dark" ? "light" : "dark");
            return;
        }
        set(currentTheme === "dark" ? "light" : "dark");
    }, [currentTheme, resolved, set]);

    const order: AppTheme[] = ["light", "dark", "system"];

    const cycle = useCallback(() => {
        const index = order.indexOf(currentTheme);
        const next = order[(index + 1) % order.length];
        set(next);
    }, [currentTheme, set]);

    return useMemo(
        () => ({
            theme: currentTheme,
            resolvedTheme: resolved,
            systemTheme: system,

            availableThemes: order,

            state: {
                isDark,
                isLight,
                isSystem,
                isHydrated: mounted,
            },

            actions: {
                set,
                toggle,
                cycle,
            },
        }),
        [
            currentTheme,
            resolved,
            system,
            isDark,
            isLight,
            isSystem,
            mounted,
            set,
            toggle,
            cycle,
        ]
    );
}