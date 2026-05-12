"use client";

import {
    useEffect,
    useState,
    useCallback,
} from "react";

import clsx from "clsx";

import { usePathname } from "next/navigation";

import { Menu } from "lucide-react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

import { Button } from "@/components/ui/button";

type AppShellProps = {
    children: React.ReactNode;
};

const DESKTOP_QUERY =
    "(min-width: 768px)";

export default function AppShell({
    children,
}: AppShellProps) {
    const pathname = usePathname();

    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    const [desktop, setDesktop] =
        useState(false);

    const closeSidebar =
        useCallback(() => {
            setSidebarOpen(false);
        }, []);

    const toggleSidebar =
        useCallback(() => {
            setSidebarOpen(
                current => !current
            );
        }, []);

    useEffect(() => {
        const mediaQuery =
            window.matchMedia(
                DESKTOP_QUERY
            );

        const syncLayout = () => {
            const desktopView =
                mediaQuery.matches;

            setDesktop(desktopView);

            if (desktopView) {
                setSidebarOpen(false);
            }
        };

        syncLayout();

        mediaQuery.addEventListener(
            "change",
            syncLayout
        );

        return () => {
            mediaQuery.removeEventListener(
                "change",
                syncLayout
            );
        };
    }, []);

    useEffect(() => {
        closeSidebar();
    }, [pathname]);

    useEffect(() => {
        if (
            desktop ||
            !sidebarOpen
        ) {
            document.body.style
                .overflow = "";

            return;
        }

        document.body.style
            .overflow = "hidden";

        return () => {
            document.body.style
                .overflow = "";
        };
    }, [
        sidebarOpen,
        desktop,
    ]);

    useEffect(() => {
        const onKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key ===
                "Escape"
            ) {
                closeSidebar();
            }
        };

        window.addEventListener(
            "keydown",
            onKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                onKeyDown
            );
        };
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900">
            <aside
                aria-hidden={
                    !desktop &&
                    !sidebarOpen
                }
                className={clsx(
                    "fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-950",
                    sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full",
                    "md:relative md:translate-x-0"
                )}
            >
                <Sidebar />
            </aside>

            <button
                type="button"
                aria-label="Close sidebar"
                tabIndex={
                    sidebarOpen
                        ? 0
                        : -1
                }
                onClick={
                    closeSidebar
                }
                className={clsx(
                    "fixed inset-0 z-30 bg-black/40 opacity-0 transition-opacity duration-200 md:hidden",
                    sidebarOpen
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none"
                )}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
                    <Header />

                    <Button
                        size="icon"
                        variant="ghost"
                        className="md:hidden"
                        aria-label="Toggle sidebar"
                        aria-expanded={
                            sidebarOpen
                        }
                        onClick={
                            toggleSidebar
                        }
                    >
                        <Menu size={18} />
                    </Button>
                </header>

                <main
                    id="main-content"
                    className="flex-1 overflow-y-auto"
                >
                    <div className="mx-auto w-full max-w-6xl p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}