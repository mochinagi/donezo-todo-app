"use client";

import {
    ThemeProvider as NextThemesProvider,
    useTheme,
} from "next-themes";

import {
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";

export type AppTheme = "light" | "dark" | "system";

type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
    children: ReactNode;
};

const STORAGE_KEY = "donezo-theme";

const THEME_ORDER: AppTheme[] = [
    "light",
    "dark",
    "system",
];

export function ThemeProvider({
    children,
}: ThemeProviderProps) {
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
    const {
        theme,
        setTheme,
        resolvedTheme,
        systemTheme,
    } = useTheme();

    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const currentTheme = (theme ??
        "system") as AppTheme;

    const resolved = (resolvedTheme ??
        "light") as ResolvedTheme;

    const system = (systemTheme ??
        "light") as ResolvedTheme;

    const set = useCallback(
        (value: AppTheme) => {
            setTheme(value);
        },
        [setTheme]
    );

    const toggle = useCallback(() => {
        setTheme(
            resolved === "dark"
                ? "light"
                : "dark"
        );
    }, [resolved, setTheme]);

    const cycle = useCallback(() => {
        const currentIndex =
            THEME_ORDER.indexOf(currentTheme);

        const nextTheme =
            THEME_ORDER[
            (currentIndex + 1) %
            THEME_ORDER.length
            ];

        setTheme(nextTheme);
    }, [currentTheme, setTheme]);

    const nextTheme =
        THEME_ORDER[
        (THEME_ORDER.indexOf(currentTheme) + 1) %
        THEME_ORDER.length
        ];

    return {
        hydrated,

        theme: currentTheme,

        resolvedTheme: resolved,

        systemTheme: system,

        nextTheme,

        isDark: hydrated && resolved === "dark",

        isLight:
            hydrated && resolved === "light",

        isSystem:
            hydrated && currentTheme === "system",

        setTheme: set,

        toggleTheme: toggle,

        cycleTheme: cycle,
    };
}