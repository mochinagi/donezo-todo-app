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

    const currentTheme = (theme ?? "system") as AppTheme;

    const safeResolvedTheme: ResolvedTheme =
        mounted && resolvedTheme ? (resolvedTheme as ResolvedTheme) : "light";

    const safeSystemTheme: ResolvedTheme =
        mounted && systemTheme ? (systemTheme as ResolvedTheme) : "light";

    const isDark = safeResolvedTheme === "dark";
    const isLight = safeResolvedTheme === "light";
    const isSystem = currentTheme === "system";

    const isReady = mounted && !!resolvedTheme;

    const applyTheme = useCallback(
        (value: AppTheme) => {
            setTheme(value);
        },
        [setTheme]
    );

    const toggleTheme = useCallback(() => {
        applyTheme(isDark ? "light" : "dark");
    }, [isDark, applyTheme]);

    const cycleTheme = useCallback(() => {
        if (currentTheme === "light") return applyTheme("dark");
        if (currentTheme === "dark") return applyTheme("system");
        return applyTheme("light");
    }, [currentTheme, applyTheme]);

    const setLight = useCallback(() => applyTheme("light"), [applyTheme]);
    const setDark = useCallback(() => applyTheme("dark"), [applyTheme]);
    const setSystem = useCallback(() => applyTheme("system"), [applyTheme]);

    const preference = currentTheme;
    const resolved = safeResolvedTheme;

    const source = currentTheme === "system" ? "system" : "user";

    return useMemo(
        () => ({
            theme: currentTheme,
            resolvedTheme: safeResolvedTheme,
            systemTheme: safeSystemTheme,

            preference,
            resolved,
            source,

            state: {
                isDark,
                isLight,
                isSystem,
                isMounted: mounted,
                isReady,
            },

            actions: {
                setTheme: applyTheme,
                toggleTheme,
                cycleTheme,
                setLight,
                setDark,
                setSystem,
            },
        }),
        [
            currentTheme,
            safeResolvedTheme,
            safeSystemTheme,
            preference,
            resolved,
            source,
            isDark,
            isLight,
            isSystem,
            mounted,
            isReady,
            applyTheme,
            toggleTheme,
            cycleTheme,
            setLight,
            setDark,
            setSystem,
        ]
    );
}