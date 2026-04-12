"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";

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

    const currentTheme = (theme ?? "system") as AppTheme;
    const currentResolved = (resolvedTheme ?? "light") as AppTheme;

    const isDark = currentResolved === "dark";
    const isLight = currentResolved === "light";
    const isSystem = currentTheme === "system";

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    const actions = useMemo(
        () => ({
            setLight: () => setTheme("light"),
            setDark: () => setTheme("dark"),
            setSystem: () => setTheme("system"),
        }),
        [setTheme]
    );

    return {
        theme: currentTheme,
        resolvedTheme: currentResolved,
        systemTheme: systemTheme as AppTheme,

        isDark,
        isLight,
        isSystem,

        setTheme: setTheme as (theme: AppTheme) => void,
        toggleTheme,

        ...actions,
    };
}