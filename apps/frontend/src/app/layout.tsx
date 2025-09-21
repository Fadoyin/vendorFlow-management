import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import dynamic from 'next/dynamic'

// Dynamic import of PersistentDashboardLayout to avoid hydration issues
const PersistentDashboardLayout = dynamic(
  () => import('../components/ui/PersistentDashboardLayout').then(mod => ({ default: mod.PersistentDashboardLayout })),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-gray-50" /> // Simple loading placeholder
  }
)

export const metadata: Metadata = {
  title: 'VendorFlow - Supply Chain Management Platform',
  description: 'Streamline your supply chain operations with advanced vendor management, inventory tracking, and intelligent forecasting.',
  keywords: ['supply chain', 'vendor management', 'inventory', 'forecasting', 'procurement'],
  authors: [{ name: 'VendorFlow Team' }],
  openGraph: {
    title: 'VendorFlow - Supply Chain Management Platform',
    description: 'Streamline your supply chain operations with advanced vendor management, inventory tracking, and intelligent forecasting.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VendorFlow - Supply Chain Management Platform',
    description: 'Streamline your supply chain operations with advanced vendor management, inventory tracking, and intelligent forecasting.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/favicon.png',
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
          <PersistentDashboardLayout>
            {children}
          </PersistentDashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
