import type { Metadata } from 'next';
import { Inter, Instrument_Serif, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const UI_THEME = (process.env.NEXT_PUBLIC_UI_THEME || process.env.UI_THEME || 'auction').toLowerCase();
const theme: 'auction' | 'legacy' = UI_THEME === 'legacy' ? 'legacy' : 'auction';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif',
});
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Twilight Explorer',
  description: 'Block explorer for the Twilight blockchain',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${inter.variable} ${instrumentSerif.variable} ${robotoMono.variable}`}
    >
      <body className="bg-background text-text min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
