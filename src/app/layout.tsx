"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";
import AppToaster from "@/components/ui/toaster";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donezo Todo App",
  description: "シンプルで使いやすいタスク管理アプリ",
  openGraph: {
    title: "Donezo Todo App",
    description: "シンプルで使いやすいタスク管理アプリ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Donezo Todo App",
    description: "シンプルで使いやすいタスク管理アプリ",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
            <aside className="flex-shrink-0" role="complementary" aria-label="サイドバー">
              <Sidebar />
            </aside>

            {/* Main content */}
            <section className="flex flex-col flex-1">

              <header className="flex-shrink-0" role="banner" aria-label="ヘッダー">
                <Header />
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