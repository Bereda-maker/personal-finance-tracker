import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Finance Tracker",
  description: "Track income, expenses, and spending trends.",
};

/**
 * Force light mode everywhere — even when the user's OS is in dark mode.
 * `colorScheme: "light"` sets <meta name="color-scheme" content="light">
 * and tells native form controls, scrollbars, and autofill UI to render light.
 */
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f6f7fb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" style={{ colorScheme: "light" }}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
