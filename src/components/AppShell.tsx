"use client";

import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";

type AppShellProps = {
    children: ReactNode;
};

const SIDEBAR_WIDTH = "w-64";

export default function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    useEffect(() => {
        closeSidebar();
    }, [pathname]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeSidebar();
            }
        };

        const handleResize = () => {
            if (window.innerWidth >= 768) {
                closeSidebar();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", handleResize);

        document.body.style.overflow = sidebarOpen ? "hidden" : "";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", handleResize);

            document.body.style.overflow = "";
        };
    }, [sidebarOpen]);

    return (
        <div className="flex h-dvh overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            <aside
                id="mobile-sidebar"
                data-state={sidebarOpen ? "open" : "closed"}
                className={clsx(
                    "fixed inset-y-0 left-0 z-40 border-r border-zinc-200 bg-white transition-all duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950",
                    "md:relative md:translate-x-0",
                    SIDEBAR_WIDTH,
                    sidebarOpen
                        ? "translate-x-0 shadow-2xl"
                        : "-translate-x-full"
                )}
            >
                <Sidebar />
            </aside>

            <button
                type="button"
                aria-label="Close sidebar overlay"
                onClick={closeSidebar}
                className={clsx(
                    "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
                    sidebarOpen
                        ? "opacity-100"
                        : "pointer-events-none opacity-0"
                )}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                        <Header />

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={toggleSidebar}
                            aria-expanded={sidebarOpen}
                            aria-controls="mobile-sidebar"
                            className="md:hidden"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}