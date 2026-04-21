"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, useState, useCallback, type ReactNode } from "react";

/* -----------------------------
   Theme 型定義
----------------------------- */

export type AppTheme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

/* -----------------------------
   Provider
----------------------------- */

type ThemeProviderProps = {
    children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
}

/* -----------------------------
   Custom Hook（进化版）
----------------------------- */

export function useAppTheme() {
    const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    /* ---------- 当前主题（安全处理） ---------- */

    const currentTheme = (theme ?? "system") as AppTheme;

    const safeResolvedTheme: ResolvedTheme = mounted
        ? (resolvedTheme as ResolvedTheme) ?? "light"
        : "light";

    const safeSystemTheme: ResolvedTheme = mounted
        ? (systemTheme as ResolvedTheme) ?? "light"
        : "light";

    /* ---------- 状态 ---------- */

    const isDark = safeResolvedTheme === "dark";
    const isLight = safeResolvedTheme === "light";
    const isSystem = currentTheme === "system";

    const isReady = mounted && !!resolvedTheme;

    /* ---------- actions ---------- */

    // 只在 light / dark 之间切换（更符合用户预期）
    const toggleTheme = useCallback(() => {
        setTheme(isDark ? "light" : "dark");
    }, [isDark, setTheme]);

    // light → dark → system
    const cycleTheme = useCallback(() => {
        if (currentTheme === "light") return setTheme("dark");
        if (currentTheme === "dark") return setTheme("system");
        return setTheme("light");
    }, [currentTheme, setTheme]);

    const setLight = useCallback(() => setTheme("light"), [setTheme]);
    const setDark = useCallback(() => setTheme("dark"), [setTheme]);
    const setSystem = useCallback(() => setTheme("system"), [setTheme]);

    /* ---------- return ---------- */

    return {
        /* core */
        theme: currentTheme,
        resolvedTheme: safeResolvedTheme,
        systemTheme: safeSystemTheme,

        /* state */
        state: {
            isDark,
            isLight,
            isSystem,
            isMounted: mounted,
            isReady,
        },

        /* actions */
        actions: {
            setTheme,
            toggleTheme,
            cycleTheme,
            setLight,
            setDark,
            setSystem,
        },
    };
}