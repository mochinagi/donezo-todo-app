import "./globals.css";

import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import AppShell from "@/components/AppShell";
import AppToaster from "@/components/ui/toaster";

const APP_NAME = "Donezo";
const APP_DESCRIPTION = "Personal task management workspace built with Next.js.";

const BODY_CLASS =
  "min-h-screen overflow-hidden bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-zinc-100 dark:selection:text-zinc-900";

export const metadata: Metadata = {
  metadataBase: new URL("https://donezo.vercel.app"),

  applicationName: APP_NAME,

  title: {
    default: APP_NAME,
    template: "%s | Donezo",
  },

  description: APP_DESCRIPTION,

  keywords: ["task manager", "todo app", "nextjs", "productivity"],

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: "https://donezo.vercel.app",
  },

  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },

  icons: {
    icon: "/favicon.ico",
  },

  manifest: "/manifest.json",

  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#fafafa",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#09090b",
    },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={BODY_CLASS}>
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
            <main id="main-content">{children}</main>
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}