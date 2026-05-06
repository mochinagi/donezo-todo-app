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
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = (theme ?? "system") as AppTheme;

    const resolved = (resolvedTheme ?? "light") as ResolvedTheme;

    const isDark = mounted && resolved === "dark";
    const isLight = mounted && resolved === "light";
    const isSystem = currentTheme === "system";

    const set = useCallback(
        (value: AppTheme) => {
            setTheme(value);
        },
        [setTheme]
    );

    const toggleDarkLight = useCallback(() => {
        set(resolved === "dark" ? "light" : "dark");
    }, [resolved, set]);

    const cycle = useCallback(() => {
        const order: AppTheme[] = ["light", "dark", "system"];
        const index = order.indexOf(currentTheme);
        const next = order[(index + 1) % order.length];
        set(next);
    }, [currentTheme, set]);

    return useMemo(
        () => ({
            theme: currentTheme,
            resolvedTheme: resolved,
            isHydrated: mounted,

            state: {
                isDark,
                isLight,
                isSystem,
            },

            actions: {
                set,
                toggleDarkLight,
                cycle,
            },
        }),
        [
            currentTheme,
            resolved,
            mounted,
            isDark,
            isLight,
            isSystem,
            set,
            toggleDarkLight,
            cycle,
        ]
    );
}