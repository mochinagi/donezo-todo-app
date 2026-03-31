import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Fonts
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Metadata（SEO強化）
 */
export const metadata: Metadata = {
  title: {
    default: "Donezo - シンプルで使いやすいTodoアプリ",
    template: "%s | Donezo",
  },
  description: "Donezoはシンプルで直感的に使えるTodo管理アプリです。日々のタスクをスマートに整理しましょう。",
  keywords: ["Todo", "タスク管理", "Next.js", "React", "生産性"],
  authors: [{ name: "Donezo Team" }],

  // SNS共有（面试加分🔥）
  openGraph: {
    title: "Donezo Todo App",
    description: "シンプルで使いやすいTodoアプリ",
    url: "https://your-domain.com",
    siteName: "Donezo",
    locale: "ja_JP",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Donezo Todo App",
    description: "シンプルで使いやすいTodoアプリ",
  },
};

/**
 * RootLayout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          antialiased
          bg-gray-50 text-gray-900
          min-h-screen
        `}
      >
        {/* 全体レイアウトラッパー */}
        <div className="min-h-screen flex flex-col">
          {/* メインコンテンツ */}
          <main className="flex-1">
            {children}
          </main>

          {/* フッター（将来用） */}
          <footer className="text-center text-sm text-gray-400 py-4">
            © {new Date().getFullYear()} Donezo
          </footer>
        </div>
      </body>
    </html>
  );
}