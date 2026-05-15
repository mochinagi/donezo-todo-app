"use client";

import {
    useCallback,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import clsx from "clsx";

import { usePathname } from "next/navigation";

import {
    Menu,
    X,
} from "lucide-react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

import { Button } from "@/components/ui/button";

type AppShellProps = {
    children: ReactNode;
};

export default function AppShell({
    children,
}: AppShellProps) {
    const pathname =
        usePathname();

    const [sidebarOpen, setSidebarOpen] =
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
        closeSidebar();
    }, [
        pathname,
        closeSidebar,
    ]);

    useEffect(() => {
        const handleKeyDown = (
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
            handleKeyDown
        );

        document.body.classList.toggle(
            "overflow-hidden",
            sidebarOpen
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.classList.remove(
                "overflow-hidden"
            );
        };
    }, [
        sidebarOpen,
        closeSidebar,
    ]);

    return (
        <div className="flex h-dvh overflow-hidden bg-zinc-50 dark:bg-zinc-900">
            <aside
                aria-label="Sidebar"
                aria-hidden={
                    !sidebarOpen
                }
                className={clsx(
                    "fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950",
                    "shadow-xl md:relative md:translate-x-0 md:shadow-none",
                    sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                )}
            >
                <Sidebar />
            </aside>

            <button
                type="button"
                aria-label="Close sidebar"
                onClick={
                    closeSidebar
                }
                className={clsx(
                    "fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 md:hidden",
                    sidebarOpen
                        ? "opacity-100"
                        : "pointer-events-none opacity-0"
                )}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
                    <div className="flex h-16 items-center justify-between px-4">
                        <Header />

                        <Button
                            size="icon"
                            variant="ghost"
                            className="md:hidden"
                            aria-expanded={
                                sidebarOpen
                            }
                            aria-controls="mobile-sidebar"
                            aria-label={
                                sidebarOpen
                                    ? "Close sidebar"
                                    : "Open sidebar"
                            }
                            onClick={
                                toggleSidebar
                            }
                        >
                            {sidebarOpen ? (
                                <X
                                    size={
                                        18
                                    }
                                />
                            ) : (
                                <Menu
                                    size={
                                        18
                                    }
                                />
                            )}
                        </Button>
                    </div>
                </header>

                <main
                    id="main-content"
                    className="flex-1 overflow-y-auto"
                >
                    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}