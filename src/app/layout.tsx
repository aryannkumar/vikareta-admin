import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AdminAuthProvider } from '@/components/providers/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vikareta Admin Panel',
  description: 'Comprehensive admin panel for managing the Vikareta platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  );
}