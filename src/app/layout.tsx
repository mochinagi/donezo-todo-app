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
    <html lang="ja">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

        <div className="flex h-screen overflow-hidden">

          {/* Sidebar */}
          <Sidebar />

          {/* Main */}
          <div className="flex flex-col flex-1">

            {/* Header */}
            <Header />

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>

          </div>

        </div>

      </body>
    </html>
  );
}