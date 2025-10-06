import type { Metadata } from 'next';
import './globals.css';
import { fontSans } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Motel Management Dashboard',
  description: 'Modern web dashboard for managing motel operations.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>{children}</body>
    </html>
  );
}
