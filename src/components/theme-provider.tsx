"use client";

import {
    ThemeProvider as NextThemesProvider,
    useTheme,
} from "next-themes";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type AppTheme =
    | "light"
    | "dark"
    | "system";

type ResolvedTheme =
    | "light"
    | "dark";

type ThemeProviderProps = {
    children: ReactNode;
};

const STORAGE_KEY = "donezo-theme";

const THEME_SEQUENCE: AppTheme[] = [
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

    const [mounted, setMounted] =
        useState(false);

    const [
        reducedMotion,
        setReducedMotion,
    ] = useState(false);

    useEffect(() => {
        setMounted(true);

        const mediaQuery =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            );

        const updateMotion = () => {
            setReducedMotion(
                mediaQuery.matches
            );
        };

        updateMotion();

        mediaQuery.addEventListener(
            "change",
            updateMotion
        );

        return () => {
            mediaQuery.removeEventListener(
                "change",
                updateMotion
            );
        };
    }, []);

    useEffect(() => {
        if (!mounted) {
            return;
        }

        const resolved =
            resolvedTheme ?? "light";

        document.documentElement.dataset.theme =
            resolved;
    }, [mounted, resolvedTheme]);

    useEffect(() => {
        const syncTheme = (
            event: StorageEvent
        ) => {
            if (
                event.key !== STORAGE_KEY ||
                !event.newValue
            ) {
                return;
            }

            setTheme(event.newValue);
        };

        window.addEventListener(
            "storage",
            syncTheme
        );

        return () => {
            window.removeEventListener(
                "storage",
                syncTheme
            );
        };
    }, [setTheme]);

    const currentTheme =
        (theme ??
            "system") as AppTheme;

    const resolved =
        (resolvedTheme ??
            "light") as ResolvedTheme;

    const system =
        (systemTheme ??
            "light") as ResolvedTheme;

    const updateTheme = useCallback(
        (value: AppTheme) => {
            setTheme(value);
        },
        [setTheme]
    );

    const toggleTheme = useCallback(
        () => {
            setTheme(
                resolved === "dark"
                    ? "light"
                    : "dark"
            );
        },
        [resolved, setTheme]
    );

    const cycleTheme = useCallback(
        () => {
            const currentIndex =
                THEME_SEQUENCE.indexOf(
                    currentTheme
                );

            const next =
                THEME_SEQUENCE[
                (currentIndex + 1) %
                THEME_SEQUENCE.length
                ];

            setTheme(next);
        },
        [currentTheme, setTheme]
    );

    const nextTheme = useMemo(() => {
        const index =
            THEME_SEQUENCE.indexOf(
                currentTheme
            );

        return THEME_SEQUENCE[
            (index + 1) %
            THEME_SEQUENCE.length
        ];
    }, [currentTheme]);

    const metadata = useMemo(
        () => ({
            light: {
                label: "Light",
            },

            dark: {
                label: "Dark",
            },

            system: {
                label: "System",
            },
        }),
        []
    );

    return {
        mounted,

        theme: currentTheme,

        resolvedTheme: resolved,

        systemTheme: system,

        nextTheme,

        reducedMotion,

        isDark:
            mounted &&
            resolved === "dark",

        isLight:
            mounted &&
            resolved === "light",

        isSystem:
            mounted &&
            currentTheme ===
            "system",

        metadata,

        setTheme: updateTheme,

        toggleTheme,

        cycleTheme,
    };
}