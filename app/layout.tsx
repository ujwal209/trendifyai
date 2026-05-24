import type { Metadata } from "next";
import "./globals.css";
import { WatchlistProvider } from "@/lib/watchlist-context";
import { Toaster } from "sonner";
import { AiProvider } from "@/lib/ai-context";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

export const metadata: Metadata = {
  title: "Trendify - Real-Time E-Commerce Price Comparator",
  description: "Compare prices for Mobiles, Laptops, Headphones, Clothes, and Home Appliances from top shopping sites. Find the cheapest deals dynamically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('trendify-theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f1f3f6] dark:bg-black">
        <WatchlistProvider>
          <AiProvider>
            <AppLayoutWrapper>
              {children}
            </AppLayoutWrapper>
          </AiProvider>
          <Toaster position="top-right" richColors />
        </WatchlistProvider>
      </body>
    </html>
  );
}

