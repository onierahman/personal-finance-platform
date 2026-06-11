import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';   // ← direct import, no wrapper needed

export const metadata: Metadata = {
  title:       'FinanceOS — Personal Finance Dashboard',
  description: 'Track expenses, budgets, savings, and investments in one place.',
  manifest:    '/manifest.json',
};

export const viewport: Viewport = {
  themeColor:   '#2563EB',
  width:        'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}