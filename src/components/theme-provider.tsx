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

/* ================= TYPES ================= */

export type AppTheme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
    children: ReactNode;
};

/* ================= PROVIDER ================= */

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

/* ================= HOOK ================= */

export function useAppTheme() {
    const { theme, setTheme, resolvedTheme, systemTheme } =
        useTheme();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    /* ---------- 安全主题 ---------- */

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

    /* ---------- 用户偏好 vs 实际主题（🔥加分点） ---------- */

    const preference = currentTheme; // 用户选择
    const resolved = safeResolvedTheme; // 实际渲染

    /* ---------- actions ---------- */

    const setLight = useCallback(() => setTheme("light"), [setTheme]);
    const setDark = useCallback(() => setTheme("dark"), [setTheme]);
    const setSystem = useCallback(() => setTheme("system"), [setTheme]);

    const toggleTheme = useCallback(() => {
        // ⭐ 始终在 light / dark 间切换（不受 system 影响）
        setTheme(isDark ? "light" : "dark");
    }, [isDark, setTheme]);

    const cycleTheme = useCallback(() => {
        if (currentTheme === "light") return setTheme("dark");
        if (currentTheme === "dark") return setTheme("system");
        return setTheme("light");
    }, [currentTheme, setTheme]);

    /* ---------- memo return（性能优化） ---------- */

    return useMemo(
        () => ({
            /* core */
            theme: currentTheme,
            resolvedTheme: safeResolvedTheme,
            systemTheme: safeSystemTheme,

            /* 🔥 新增语义层 */
            preference,
            resolved,

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
        }),
        [
            currentTheme,
            safeResolvedTheme,
            safeSystemTheme,
            preference,
            resolved,
            isDark,
            isLight,
            isSystem,
            mounted,
            isReady,
            setTheme,
            toggleTheme,
            cycleTheme,
            setLight,
            setDark,
            setSystem,
        ]
    );
}