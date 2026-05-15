import "./globals.css";

import type {
  Metadata,
  Viewport,
} from "next";

import AppShell from "@/components/AppShell";

import {
  ThemeProvider,
} from "@/components/theme-provider";

import AppToaster from "@/components/ui/toaster";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://donezo.vercel.app"
  ),

  title: {
    default: "Donezo",
    template:
      "%s | Donezo",
  },

  description:
    "Task management workspace built with Next.js and Zustand.",

  applicationName:
    "Donezo",

  keywords: [
    "todo",
    "task manager",
    "nextjs",
    "zustand",
    "productivity",
  ],

  authors: [
    {
      name: "guatit",
    },
  ],

  creator: "guatit",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",

    siteName:
      "Donezo",

    url: "https://donezo.vercel.app",

    title: "Donezo",

    description:
      "Task management workspace built with Next.js and Zustand.",
  },

  twitter: {
    card:
      "summary_large_image",

    title: "Donezo",

    description:
      "Task management workspace built with Next.js and Zustand.",
  },

  appleWebApp: {
    capable: true,

    title: "Donezo",

    statusBarStyle:
      "default",
  },

  manifest:
    "/manifest.json",

  icons: {
    icon: "/favicon.ico",
    apple:
      "/apple-touch-icon.png",
  },

  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport =
{
  width:
    "device-width",

  initialScale: 1,

  maximumScale: 1,

  colorScheme:
    "dark light",

  interactiveWidget:
    "resizes-content",

  themeColor: [
    {
      media:
        "(prefers-color-scheme: light)",

      color:
        "#fafafa",
    },

    {
      media:
        "(prefers-color-scheme: dark)",

      color:
        "#09090b",
    },
  ],
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
    >
      <body
        className="min-h-dvh overflow-hidden bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-zinc-100 dark:selection:text-zinc-900"
      >
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
          >
            Skip to main content
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