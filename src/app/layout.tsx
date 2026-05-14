import "./globals.css";

import type {
  Metadata,
  Viewport,
} from "next";

import { ThemeProvider } from "@/components/theme-provider";

import AppShell from "@/components/AppShell";
import AppToaster from "@/components/ui/toaster";

const APP_NAME = "Donezo";

const APP_DESCRIPTION =
  "Task management workspace built with Next.js and Zustand.";

const APP_URL =
  "https://donezo.vercel.app";

const bodyClassName = [
  "min-h-screen",
  "overflow-hidden",
  "bg-zinc-50",
  "font-sans",
  "text-zinc-900",
  "antialiased",
  "selection:bg-zinc-900",
  "selection:text-white",
  "dark:bg-zinc-950",
  "dark:text-zinc-100",
  "dark:selection:bg-zinc-100",
  "dark:selection:text-zinc-900",
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  applicationName: APP_NAME,

  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },

  description: APP_DESCRIPTION,

  keywords: [
    "task manager",
    "todo app",
    "productivity",
    "nextjs",
    "zustand",
    "task tracking",
  ],

  authors: [
    {
      name: "guatit",
    },
  ],

  creator: "guatit",

  category: "productivity",

  referrer: "origin-when-cross-origin",

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",

    url: APP_URL,

    siteName: APP_NAME,

    title: APP_NAME,

    description:
      APP_DESCRIPTION,
  },

  twitter: {
    card: "summary_large_image",

    title: APP_NAME,

    description:
      APP_DESCRIPTION,
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },

  formatDetection: {
    telephone: false,
  },

  manifest: "/manifest.json",

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",

  initialScale: 1,

  maximumScale: 1,

  colorScheme: "dark light",

  interactiveWidget:
    "resizes-content",

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
        className={
          bodyClassName
        }
      >
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
            Skip to main content
          </a>

          <AppToaster />

          <AppShell>
            <main
              id="main-content"
              className="h-full min-h-screen"
            >
              {children}
            </main>
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}