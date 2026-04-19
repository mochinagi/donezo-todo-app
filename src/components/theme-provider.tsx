"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";

/* -----------------------------
   Theme 型定義
----------------------------- */
export type AppTheme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

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
   Custom Hook（增强版）
----------------------------- */
export function useAppTheme() {
    const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    /* ---------- 当前主题 ---------- */
    const currentTheme = (theme ?? "system") as AppTheme;
    const currentResolved = (resolvedTheme ?? "light") as ResolvedTheme;
    const currentSystem = (systemTheme ?? "light") as ResolvedTheme;

    /* ---------- 状态 ---------- */
    const isDark = currentResolved === "dark";
    const isLight = currentResolved === "light";
    const isSystem = currentTheme === "system";

    /* ---------- toggle ---------- */
    const toggleTheme = useCallback(() => {
        if (currentTheme === "system") {
            setTheme(currentResolved === "dark" ? "light" : "dark");
        } else {
            setTheme(currentTheme === "dark" ? "light" : "dark");
        }
    }, [currentTheme, currentResolved, setTheme]);

    /* ---------- cycle ---------- */
    const cycleTheme = useCallback(() => {
        if (currentTheme === "light") return setTheme("dark");
        if (currentTheme === "dark") return setTheme("system");
        return setTheme("light");
    }, [currentTheme, setTheme]);

    return {
        /* core */
        theme: currentTheme,
        resolvedTheme: currentResolved,
        systemTheme: currentSystem,

        /* state */
        state: {
            isDark,
            isLight,
            isSystem,
            isMounted: mounted,
        },

        /* actions */
        actions: {
            setTheme,
            toggleTheme,
            cycleTheme,
            setLight: () => setTheme("light"),
            setDark: () => setTheme("dark"),
            setSystem: () => setTheme("system"),
        },
    };
}