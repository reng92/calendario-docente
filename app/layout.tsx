import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { InstallButton } from '@/components/InstallButton'

export const metadata: Metadata = {
  title: 'Calendario docente',
  description: 'Calendario impegni IIS Einstein-Bachelet',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Calendario',
  },
}

export const viewport: Viewport = {
  themeColor: '#1c1917',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-stone-100 antialiased">
        <ServiceWorkerRegister />
        <InstallButton floatingFallback />
        {children}
      </body>
    </html>
  )
}
