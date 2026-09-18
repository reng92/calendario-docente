import type { Metadata, Viewport } from 'next'
import { Titillium_Web } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

const titillium = Titillium_Web({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-titillium',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Calendario docente',
  description: 'Calendario impegni ISISS Magarotto',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Calendario',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171e2b' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning className={titillium.variable}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t=localStorage.getItem('theme');
              var d=window.matchMedia('(prefers-color-scheme:dark)').matches;
              if(t==='dark'||(t!=='light'&&d)) document.documentElement.classList.add('dark');
            } catch(e) {}
          })()
        ` }} />
      </head>
      <body className="bg-bg text-ink font-sans antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
