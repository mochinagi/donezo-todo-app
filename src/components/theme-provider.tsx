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
    useRef,
    type ReactNode,
} from "react";

/* ================= TYPES ================= */

export type AppTheme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
    children: ReactNode;
};

const STORAGE_KEY = "donezo-theme";

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
    const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const userSelectedRef = useRef(false);

    useEffect(() => {
        setMounted(true);

        // restore user preference（你自己的控制层）
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
            if (saved) {
                userSelectedRef.current = true;
                setTheme(saved);
            }
        } catch { }
    }, [setTheme]);

    /* ---------- 安全主题 ---------- */

    const currentTheme = (theme ?? "system") as AppTheme;

    const safeResolvedTheme: ResolvedTheme =
        mounted && resolvedTheme ? (resolvedTheme as ResolvedTheme) : "light";

    const safeSystemTheme: ResolvedTheme =
        mounted && systemTheme ? (systemTheme as ResolvedTheme) : "light";

    /* ---------- 状态 ---------- */

    const isDark = safeResolvedTheme === "dark";
    const isLight = safeResolvedTheme === "light";
    const isSystem = currentTheme === "system";

    const isReady = mounted && !!resolvedTheme;

    /* ---------- 行为封装 ---------- */

    const persist = (value: AppTheme) => {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch { }
    };

    const applyTheme = useCallback(
        (value: AppTheme, fromUser = true) => {
            if (fromUser) userSelectedRef.current = true;
            setTheme(value);
            persist(value);
        },
        [setTheme]
    );

    const setLight = useCallback(() => applyTheme("light"), [applyTheme]);
    const setDark = useCallback(() => applyTheme("dark"), [applyTheme]);
    const setSystem = useCallback(() => applyTheme("system"), [applyTheme]);

    const toggleTheme = useCallback(() => {
        applyTheme(isDark ? "light" : "dark");
    }, [isDark, applyTheme]);

    const cycleTheme = useCallback(() => {
        if (currentTheme === "light") return applyTheme("dark");
        if (currentTheme === "dark") return applyTheme("system");
        return applyTheme("light");
    }, [currentTheme, applyTheme]);

    const resetTheme = useCallback(() => {
        userSelectedRef.current = false;
        applyTheme("system", false);
    }, [applyTheme]);

    /* ---------- 语义层（关键） ---------- */

    const preference = currentTheme;
    const resolved = safeResolvedTheme;

    const source = userSelectedRef.current ? "user" : "system";

    /* ---------- return ---------- */

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
                resetTheme,
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
            applyTheme,
            toggleTheme,
            cycleTheme,
            resetTheme,
            setLight,
            setDark,
            setSystem,
        ]
    );
}