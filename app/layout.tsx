import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppHeader } from "@/components/app-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReviewOS · Evidence Review",
  description:
    "Human-led application evidence review: missing evidence and mismatch detection with AI assistance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 lg:px-8 lg:py-10">
            {children}
          </main>
          <footer className="border-t bg-card">
            <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-5 py-3 text-xs text-muted-foreground lg:px-8">
              <span>
                Exercise prototype using synthetic data. Not commissioned or
                endorsed by Schmitz-Stiftungen.
              </span>
              <span className="ml-auto">
                AI assists the reviewer. It never approves or rejects.
              </span>
            </div>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
