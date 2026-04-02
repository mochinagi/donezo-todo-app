import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

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
      <body
        className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex"
        role="application"
      >
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <aside className="flex-shrink-0">
            <Sidebar />
          </aside>

          {/* Main content */}
          <div className="flex flex-col flex-1">

            {/* Header */}
            <header className="flex-shrink-0">
              <Header />
            </header>

            {/* Content */}
            <main
              className="flex-1 overflow-y-auto p-6"
              role="main"
              aria-live="polite"
            >
              {children}
            </main>

          </div>

        </div>
      </body>
    </html>
  );
}