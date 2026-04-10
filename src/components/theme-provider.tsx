"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
            disableTransitionOnChange // 🔥 防止切换闪动
        >
            <ThemeWrapper>{children}</ThemeWrapper>
        </NextThemesProvider>
    );
}

/* -----------------------------
   Mounted 保護（超重要）
----------------------------- */
function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <>{children}</>;
}

/* -----------------------------
   Custom Hook（更好用）
----------------------------- */
export function useAppTheme() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return {
        theme: theme as AppTheme,
        resolvedTheme: resolvedTheme as AppTheme,
        setTheme: setTheme as (theme: AppTheme) => void,
        toggleTheme,
    };
}