"use client";

import {
    useEffect,
    useState,
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
    children: React.ReactNode;
};

export default function AppShell({
    children,
}: AppShellProps) {
    const pathname = usePathname();

    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!sidebarOpen) {
            document.body.classList.remove(
                "overflow-hidden"
            );

            return;
        }

        document.body.classList.add(
            "overflow-hidden"
        );

        return () => {
            document.body.classList.remove(
                "overflow-hidden"
            );
        };
    }, [sidebarOpen]);

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key ===
                "Escape"
            ) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900">
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Sidebar"
                className={clsx(
                    "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-zinc-200 bg-white shadow-xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950 md:relative md:translate-x-0 md:shadow-none",
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
                onClick={() =>
                    setSidebarOpen(false)
                }
                className={clsx(
                    "fixed inset-0 z-30 bg-black/40 opacity-0 backdrop-blur-[1px] transition duration-300 md:hidden",
                    sidebarOpen
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none"
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
                            aria-label={
                                sidebarOpen
                                    ? "Close sidebar"
                                    : "Open sidebar"
                            }
                            aria-expanded={
                                sidebarOpen
                            }
                            onClick={() =>
                                setSidebarOpen(
                                    current =>
                                        !current
                                )
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