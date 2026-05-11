import "./globals.css";

import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";

import AppShell from "@/components/AppShell";

import AppToaster from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Donezo",
  description:
    "Task management workspace built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider>
          <AppToaster />

          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
          >
            Skip to content
          </a>

          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}