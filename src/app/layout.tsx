"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";
import AppToaster from "@/components/ui/toaster";
import type { Metadata } from "next";
import { useState } from "react";
import { Menu } from "lucide-react";

export const metadata: Metadata = {
  title: "Donezo Todo App",
  description: "シンプルで使いやすいタスク管理アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <html lang="ja" className="scroll-smooth">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

        <ThemeProvider>

          {/* skip link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-2 py-1 rounded bg-blue-600 text-white"
          >
            メインコンテンツへスキップ
          </a>

          {/* toaster */}
          <AppToaster />

          <div className="flex h-screen overflow-hidden">

            {/* sidebar */}
            <aside
              id="sidebar"
              className={`
                fixed md:relative top-0 left-0 h-full w-64 z-50
                bg-white dark:bg-gray-900
                transform transition-transform duration-300
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                md:translate-x-0
              `}
              aria-label="サイドバー"
            >
              <Sidebar />
            </aside>

            {/* overlay（只跟 sidebar 相关） */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/30 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* main layout */}
            <div className="flex flex-col flex-1">

              {/* header */}
              <header
                className="flex items-center justify-between p-4"
                role="banner"
              >
                <Header />

                <button
                  className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                  aria-label="サイドバー切替"
                  aria-expanded={isSidebarOpen}
                  aria-controls="sidebar"
                  onClick={() => setSidebarOpen((v) => !v)}
                >
                  <Menu size={24} />
                </button>
              </header>

              {/* main */}
              <main
                id="main-content"
                className="flex-1 overflow-y-auto p-6"
              >
                {children}
              </main>

            </div>

          </div>

        </ThemeProvider>

      </body>
    </html>
  );
}