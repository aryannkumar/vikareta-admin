import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminProviders } from "@/components/providers/admin-providers";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vikareta Admin Portal",
  description: "Administrative dashboard for Vikareta marketplace platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <ErrorBoundary>
          <AdminProviders>
            {children}
          </AdminProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
