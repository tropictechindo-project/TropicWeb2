import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/theme-provider";
import { StickyPanelInfo } from "@/components/StickyPanelInfo";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { IslandHub } from "@/components/ui/IslandHub";
import { PWAInstallPrompt } from "@/components/shared/PWAInstallPrompt";
import { RealtimeHandler } from "../components/shared/RealtimeHandler";
import QueryProvider from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://tropictech.online'),

  // ── Primary ──────────────────────────────────────────────────────────────
  title: {
    default: 'Tropic Tech - Remote Work Infrastructure Service | Monitors, Chairs, Desks',
    template: '%s | Tropic Tech',
  },
  description: 'Premium remote work infrastructure service in Bali. Rent high-performance monitors, ergonomic chairs, and standing desks. Delivering productivity to digital nomads and remote teams island-wide.',
  keywords: [
    'workstation rental bali',
    'monitor rental bali',
    'ergonomic chair rental bali',
    'standing desk rental bali',
    'office equipment rental bali',
    'digital nomad workstation bali',
    'bali remote work setup',
    'canggu ergonomic chair rental',
    'ubud monitor rental',
    'seminyak standing desk',
    'uluwatu monitor rental',
    'sanur ergonomic chair',
    'tanah lot workstation setup',
    'tropic tech bali rentals',
    'laptop workstation bali',
    'remote work equipment indonesia',
    'best desk rental bali',
    'premium monitor hire bali',
  ],
  applicationName: 'Tropic Tech',
  category: 'Business Equipment Rental',
  authors: [{ name: 'PT Tropic Tech International', url: 'https://tropictech.online' }],
  creator: 'Tropic Tech Bali',
  publisher: 'PT Tropic Tech International',

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    title: 'Tropic Tech - Remote Work Infrastructure Service',
    description: 'Premium remote work infrastructure rentals in Bali. Serving digital nomads & remote workers since 2019. Delivery to Canggu, Seminyak, Ubud & beyond.',
    url: 'https://tropictech.online',
    siteName: 'Tropic Tech Bali',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/images/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Tropic Tech – Premium Workstation Rental Bali',
        type: 'image/webp',
      },
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'Tropic Tech - Remote Work Infrastructure Service',
    description: 'Rent monitors, ergonomic chairs & desks in Bali. Fast delivery, flexible plans. Trusted by 500+ digital nomads.',
    images: ['/images/og-image.webp'],
    creator: '@tropictechs',
    site: '@tropictechs',
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/images/Logo.webp', type: 'image/webp' },
    ],
    shortcut: '/images/Logo.webp',
    apple: '/images/Logo.webp',
  },

  // ── Manifest & Alternates ─────────────────────────────────────────────────
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://tropictech.online',
    languages: {
      'en-US': 'https://tropictech.online/en',
      'id-ID': 'https://tropictech.online/id',
    },
  },

  // ── Verification ──────────────────────────────────────────────────────────
  verification: {
    google: 'G-XXXXXXXXXX', // Use the actual GA4/Google ID if available, otherwise leave as standard tag
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ivszititvwyxeglntscj.supabase.co" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Skip to content - Accessibility (keyboard users & screen readers) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <LanguageProvider>
              <AuthProvider>
                <NotificationPrompt />
                <NotificationProvider>
                  <CartProvider>
                    <RealtimeHandler />
                    <StickyPanelInfo />
                    <IslandHub />
                    {children}
                  </CartProvider>
                </NotificationProvider>
              </AuthProvider>
            </LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
