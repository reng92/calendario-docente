import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  /** Se presente, mostra una freccia indietro verso questo percorso */
  back?: string
  /** Una sola azione a destra (bottone o link già stilizzato) */
  action?: ReactNode
  /** Contenuto extra sotto la riga del titolo (es. selettore settimana) */
  children?: ReactNode
  wide?: boolean
}

export function AppHeader({ title, subtitle, back, action, children, wide }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className={`mx-auto flex min-h-14 items-center gap-2 px-4 ${wide ? 'max-w-6xl' : 'max-w-xl'}`}>
        {back && (
          <Link
            href={back}
            aria-label="Indietro"
            className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface-2"
          >
            <ChevronLeft className="size-6" />
          </Link>
        )}
        <div className="min-w-0 flex-1 py-2">
          <h1 className="truncate text-title leading-tight text-ink">{title}</h1>
          {subtitle && <p className="truncate text-small text-muted">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center">{action}</div>}
      </div>
      {children && (
        <div className={`mx-auto px-4 pb-2 ${wide ? 'max-w-6xl' : 'max-w-xl'}`}>{children}</div>
      )}
    </header>
  )
}
