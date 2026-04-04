import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donezo Todo App",
  description: "シンプルで使いやすいタスク管理アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="scroll-smooth">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex h-screen overflow-hidden">

        <ThemeProvider>
          {/* Sidebar */}
          <aside className="flex-shrink-0" aria-label="サイドバー">
            <Sidebar />
          </aside>

          {/* Main Layout */}
          <section className="flex flex-col flex-1">

            {/* Header */}
            <header className="flex-shrink-0" aria-label="ヘッダー">
              <Header />
            </header>

            {/* Main */}
            <main
              id="main-content"
              className="flex-1 overflow-y-auto p-6"
              aria-live="polite"
            >
              {children}
            </main>

          </section>
        </ThemeProvider>

      </body>
    </html>
  );
}