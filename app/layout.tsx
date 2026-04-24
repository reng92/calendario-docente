import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Calendario docente',
  description: 'Calendario impegni IIS Einstein-Bachelet',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-stone-100 antialiased">{children}</body>
    </html>
  )
}
