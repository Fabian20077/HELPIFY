import type { Metadata } from 'next';
import { Inter, Poppins, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { FilmGrainOverlay } from '@/components/film-grain';
import { ReactQueryProvider } from '@/components/react-query-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Helpify — Soporte Inteligente',
  description: 'Sistema de gestión de tickets con priorización automática.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif' }}
      >
        <FilmGrainOverlay />
        <ReactQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
