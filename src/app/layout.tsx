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
import { LocationPrompt } from "@/components/location/LocationPrompt";
import { NotificationPrompt } from "@/components/NotificationPrompt";

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
    default: 'Tropic Tech Bali – #1 Workstation Rental Bali | Monitors, Chairs, Desks',
    template: '%s | Tropic Tech Bali',
  },
  description: 'Maximize your productivity. Rent #1 premium monitors, ergonomic chairs & standing desks in Bali. Ultra-fast island-wide delivery. High-performance workstation rental for digital nomads and remote teams in Canggu, Ubud & Seminyak.',
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
    'tropic tech bali rentals',
    'laptop workstation bali',
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
    title: 'Tropic Tech Bali – Workstation Rental Bali | Monitors, Chairs, Desks',
    description: 'Premium workstation rentals in Bali. Serving digital nomads & remote workers since 2019. Delivery to Canggu, Seminyak, Ubud & beyond.',
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
    title: 'Tropic Tech Bali – #1 Workstation Rental Bali',
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
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
          <LanguageProvider>
            <AuthProvider>
              <LocationPrompt />
              <NotificationPrompt />
              <NotificationProvider>
                <CartProvider>
                  <StickyPanelInfo />
                  {children}
                </CartProvider>
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
