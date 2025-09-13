import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "VendorFlow - Smart Vendor & Inventory Management",
  description: "Unleash efficiency with smart vendor and inventory management. Gain full control over your stock and cultivate strong vendor relationships.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no'
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=3', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.svg?v=3', sizes: 'any', type: 'image/svg+xml' },
      { url: '/favicon.png?v=3', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/logo1.png',
    shortcut: '/favicon.ico?v=3',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
