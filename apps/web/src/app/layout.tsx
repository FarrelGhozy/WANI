import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/theme/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'WANI — WA Niaga untuk UMKM',
  description: 'Platform omnichannel UMKM: WhatsApp Bot + Dashboard + Web Store',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-surface-50 text-surface-900`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
