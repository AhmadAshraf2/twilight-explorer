import type { Metadata, Viewport } from 'next';
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
  adjustFontFallback: false,

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
      <body className="bg-background text-text">
        {/* Page container - flexbox layout */}
        <div 
          className="min-h-screen bg-[#050505] flex flex-col"
        >
          <Providers>
            {/* Header spans full width */}
            <Header />
            
            {/* Main content container: fixed 1432px on lg+, full width on smaller screens */}
            <main 
              className="flex-1 w-full lg:w-[1432px] lg:mx-auto px-4 sm:px-6 lg:px-[156px] pt-20 lg:pt-[57px] pb-6 lg:pb-12"
            >
              {children}
            </main>
            
            {/* Footer spans full width */}
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  );
}
