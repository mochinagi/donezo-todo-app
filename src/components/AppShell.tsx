"use client";

import {
    useEffect,
    useState,
} from "react";

import { Menu } from "lucide-react";

import Sidebar from "@/components/Sidebar";

import Header from "@/components/Header";

import { Button } from "@/components/ui/button";

type AppShellProps = {
    children: React.ReactNode;
};

export default function AppShell({
    children,
}: AppShellProps) {
    const [
        sidebarOpen,
        setSidebarOpen,
    ] = useState(false);

    useEffect(() => {
        const onResize = () => {
            if (
                window.innerWidth >= 768
            ) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener(
            "resize",
            onResize
        );

        return () => {
            window.removeEventListener(
                "resize",
                onResize
            );
        };
    }, []);

    return (
        <div className="flex h-screen overflow-hidden">
            <aside
                className={[
                    "fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-950",
                    sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full",
                    "md:relative md:translate-x-0",
                ].join(" ")}
            >
                <Sidebar />
            </aside>

            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    className="fixed inset-0 z-30 bg-black/40 md:hidden"
                    onClick={() =>
                        setSidebarOpen(
                            false
                        )
                    }
                />
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <Header />

                    <Button
                        size="icon"
                        variant="ghost"
                        className="md:hidden"
                        aria-label="Toggle sidebar"
                        onClick={() =>
                            setSidebarOpen(
                                (
                                    value
                                ) =>
                                    !value
                            )
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