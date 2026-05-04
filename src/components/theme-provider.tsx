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

    const resolved: ResolvedTheme =
        mounted && resolvedTheme ? (resolvedTheme as ResolvedTheme) : "light";

    const system: ResolvedTheme =
        mounted && systemTheme ? (systemTheme as ResolvedTheme) : "light";

    const isDark = resolved === "dark";
    const isLight = resolved === "light";
    const isSystem = currentTheme === "system";

    const isReady = mounted;

    const set = useCallback(
        (value: AppTheme) => {
            setTheme(value);
        },
        [setTheme]
    );

    const toggle = useCallback(() => {
        set(isDark ? "light" : "dark");
    }, [isDark, set]);

    const cycle = useCallback(() => {
        if (currentTheme === "light") return set("dark");
        if (currentTheme === "dark") return set("system");
        return set("light");
    }, [currentTheme, set]);

    const availableThemes: AppTheme[] = ["light", "dark", "system"];

    return useMemo(
        () => ({
            theme: currentTheme,
            resolvedTheme: resolved,
            systemTheme: system,

            availableThemes,

            state: {
                isDark,
                isLight,
                isSystem,
                isMounted: mounted,
                isReady,
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
            isReady,
            set,
            toggle,
            cycle,
        ]
    );
}