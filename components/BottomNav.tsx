'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck2, CalendarDays, Megaphone, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/components/utils'

const TABS = [
  { href: '/oggi', label: 'Oggi', Icon: CalendarCheck2, match: (p: string) => p === '/oggi' },
  { href: '/', label: 'Calendario', Icon: CalendarDays, match: (p: string) => p === '/' },
  { href: '/circolari', label: 'Circolari', Icon: Megaphone, match: (p: string) => p.startsWith('/circolari') },
  { href: '/altro', label: 'Altro', Icon: SlidersHorizontal, match: (p: string) => p.startsWith('/altro') || p.startsWith('/admin') },
]

export function BottomNav() {
  const pathname = usePathname() ?? ''
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-safe backdrop-blur supports-[backdrop-filter]:bg-surface/85"
    >
      <ul className="mx-auto flex max-w-xl items-stretch">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 pt-1.5 pb-1 text-[13px] font-semibold leading-none transition-colors',
                  active ? 'text-accent' : 'text-muted hover:text-ink',
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
