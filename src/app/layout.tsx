import "./globals.css";

import type {
  Metadata,
  Viewport,
} from "next";

import { ThemeProvider } from "@/components/theme-provider";

import AppShell from "@/components/AppShell";

import AppToaster from "@/components/ui/toaster";

const appName = "Donezo";

const appDescription =
  "Personal task management workspace built with Next.js.";

export const metadata: Metadata =
{
  metadataBase: new URL(
    "https://donezo.vercel.app"
  ),

  applicationName:
    appName,

  title: {
    default: appName,

    template:
      "%s | Donezo",
  },

  description:
    appDescription,

  keywords: [
    "task manager",
    "todo app",
    "nextjs",
    "productivity",
  ],

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",

    siteName: appName,

    title: appName,

    description:
      appDescription,
  },

  twitter: {
    card:
      "summary_large_image",

    title: appName,

    description:
      appDescription,
  },
};

export const viewport: Viewport =
{
  themeColor: [
    {
      media:
        "(prefers-color-scheme: light)",

      color: "#fafafa",
    },
    {
      media:
        "(prefers-color-scheme: dark)",

      color: "#09090b",
    },
  ],

  colorScheme:
    "dark light",
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
      <body className="min-h-screen overflow-hidden bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
          >
            メインコンテンツへ移動
          </a>

          <AppToaster />

          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}