"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, useState, useMemo, useCallback } from "react";

/* -----------------------------
   Theme 型定義
----------------------------- */
export type AppTheme = "light" | "dark" | "system";

/* -----------------------------
   Provider
----------------------------- */
export function ThemeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
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
   Theme Ready（防闪烁 hook）
----------------------------- */
export function useThemeReady() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
}

/* -----------------------------
   Custom Hook（增强版）
----------------------------- */
export function useAppTheme() {
    const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

    const mounted = useThemeReady();

    /* ---------- 当前主题 ---------- */
    const currentTheme = (theme ?? "system") as AppTheme;
    const currentResolved = (resolvedTheme ?? "light") as AppTheme;
    const currentSystem = (systemTheme ?? "light") as AppTheme;

    /* ---------- 状态 ---------- */
    const isDark = currentResolved === "dark";
    const isLight = currentResolved === "light";
    const isSystem = currentTheme === "system";

    /* ---------- 安全设置 ---------- */
    const setThemeSafe = useCallback(
        (next: AppTheme) => {
            setTheme(next);
        },
        [setTheme]
    );

    /* ---------- toggle（只在 light/dark 间切） ---------- */
    const toggleTheme = useCallback(() => {
        setThemeSafe(isDark ? "light" : "dark");
    }, [isDark, setThemeSafe]);

    /* ---------- 循环切换（更高级） ---------- */
    const cycleTheme = useCallback(() => {
        if (currentTheme === "light") return setThemeSafe("dark");
        if (currentTheme === "dark") return setThemeSafe("system");
        return setThemeSafe("light");
    }, [currentTheme, setThemeSafe]);

    /* ---------- actions ---------- */
    const actions = useMemo(
        () => ({
            setLight: () => setThemeSafe("light"),
            setDark: () => setThemeSafe("dark"),
            setSystem: () => setThemeSafe("system"),
        }),
        [setThemeSafe]
    );

    return {
        /* core */
        theme: currentTheme,
        resolvedTheme: currentResolved,
        systemTheme: currentSystem,

        /* state */
        isDark,
        isLight,
        isSystem,
        isMounted: mounted,

        /* actions */
        setTheme: setThemeSafe,
        toggleTheme,
        cycleTheme,

        ...actions,
    };
}