import type { Metadata } from 'next';
import { Inter, Sora, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import AuthorBio from '@/components/AuthorBio';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { ADS_SCRIPT_SRC, AD_UNIT_IDS } from '@/lib/ads';
import { LOGO_ABSOLUTE_URL, NOINDEX, SITE_DESCRIPTION, SITE_NAME, SITE_URL, withBasePath } from '@/lib/site';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const sora = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-sora', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  keywords: [SITE_NAME, 'Morse code', 'Morse code translator', 'Text to Morse', 'Morse to text'],
  applicationName: SITE_NAME,
  alternates: { canonical: SITE_URL },
  robots: NOINDEX ? { index: false, follow: false } : undefined,
  authors: [{ name: 'Youssef Hesham' }],
  creator: 'Youssef Hesham',
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
    images: [{ url: LOGO_ABSOLUTE_URL }],
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION, images: [LOGO_ABSOLUTE_URL] },
  icons: {
    icon: [
      { url: withBasePath('/wp-content/uploads/2026/01/cropped-morse-code-32x32.webp'), sizes: '32x32', type: 'image/webp' },
      { url: withBasePath('/wp-content/uploads/2026/01/cropped-morse-code-192x192.webp'), sizes: '192x192', type: 'image/webp' },
    ],
    shortcut: withBasePath('/wp-content/uploads/2026/01/cropped-morse-code-32x32.webp'),
    apple: withBasePath('/wp-content/uploads/2026/01/cropped-morse-code-180x180.webp'),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${mono.variable}`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RRLGT55EF1"
          strategy="afterInteractive"
        />
        <Script src={ADS_SCRIPT_SRC} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RRLGT55EF1');
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col bg-[#f4f6fb] text-ink-900 antialiased">
        <div className="page-bg-decor" aria-hidden="true" />
        <div id={AD_UNIT_IDS.anchor} />
        <Header />
        <div id={AD_UNIT_IDS.topLeaderboard} />
        <main className="flex-1 relative z-10">{children}</main>
        <div id={AD_UNIT_IDS.bottom} />
        <AuthorBio />
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
