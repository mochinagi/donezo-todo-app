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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="ja" className="scroll-smooth">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex">

        <ThemeProvider>

          {/* Skip link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-2 py-1 rounded z-50"
          >
            Skip to main content
          </a>

          {/* Toast notifications */}
          <AppToaster />

          <div className="flex flex-1 h-screen overflow-hidden">

            {/* Sidebar */}
            <aside
              className={`
                fixed md:relative top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 z-50
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
                md:translate-x-0
              `}
              role="complementary"
              aria-label="サイドバー"
            >
              <Sidebar />
            </aside>

            {/* Overlay for small screens */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/30 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              ></div>
            )}

            {/* Main content */}
            <section className="flex flex-col flex-1">

              <header className="flex-shrink-0 flex items-center justify-between p-4" role="banner" aria-label="ヘッダー">
                <Header />

                {/* Hamburger for small screens */}
                <button
                  className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                  aria-label="Toggle Sidebar"
                  onClick={() => setSidebarOpen(!isSidebarOpen)}
                >
                  <Menu size={24} />
                </button>
              </header>

              <main id="main-content" className="flex-1 overflow-y-auto p-6">
                {children}
              </main>

            </section>

          </div>

        </ThemeProvider>

      </body>
    </html>
  );
}