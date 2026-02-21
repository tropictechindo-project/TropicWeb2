import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/theme-provider";

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

export const metadata: Metadata = {
  metadataBase: new URL('https://testdomain.fun'),
  title: 'Tropic Tech - #1 Workstation Rental Bali | Monitors, Chairs, Desks',
  description: 'Premium office equipment rental in Bali. High-end monitors, ergonomic chairs, and standing desks. Fast delivery for digital nomads and remote workers.',
  keywords: 'bali workstation rental, monitor rental bali, ergonomic chair rental bali, office equipment bali, digital nomad bali, tropic tech',
  authors: [{ name: "PT Tropic Tech International" }],
  creator: "Tropic Tech",
  publisher: "PT Tropic Tech International",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Tropic Tech - Rent Workstation in Bali",
    description: "Professional workstation rental in Bali. 5+ years experience serving digital nomads and remote workers with fast delivery.",
    url: "https://testdomain.fun",
    siteName: "Tropic Tech",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Tropic Tech Workstation Rental",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tropic Tech - Workstation Rental in Bali",
    description: "Professional workstation rental in Bali. 5+ years experience serving digital nomads.",
    images: ["/images/og-image.webp"],
    creator: "@tropictechs",
  },
  icons: {
    icon: "/images/Logo.webp",
    shortcut: "/images/Logo.webp",
    apple: "/images/Logo.webp",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://testdomain.fun",
    languages: {
      'en': 'https://testdomain.fun/en',
      'id': 'https://testdomain.fun/id',
    },
  },
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <NotificationProvider>
                <CartProvider>
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
