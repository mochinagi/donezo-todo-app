import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import type { Metadata } from "next";

/**
 * Metadata（SEO / タイトル設定）
 */
export const metadata: Metadata = {
  title: "Donezo Todo App",
  description: "シンプルで使いやすいタスク管理アプリ",
};

/**
 * Root Layout（アプリ全体のレイアウト）
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="scroll-smooth">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex h-screen overflow-hidden">

        {/* Sidebar */}
        <aside
          className="flex-shrink-0"
          aria-label="サイドバー"
        >
          <Sidebar />
        </aside>

        {/* Main Layout */}
        <section className="flex flex-col flex-1">

          {/* Header */}
          <header
            className="flex-shrink-0"
            aria-label="ヘッダー"
          >
            <Header />
          </header>

          {/* Main Content */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto p-6"
            aria-live="polite"
          >
            {children}
          </main>

        </section>
      </body>
    </html>
  );
}