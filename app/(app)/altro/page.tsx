import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { SCHOOL_NAME, SCHOOL_CITY } from '@/lib/schedule'

export default function AltroPage() {
  return (
    <main className="mx-auto max-w-xl">
      <AppHeader title="Altro" subtitle={`${SCHOOL_NAME} · ${SCHOOL_CITY}`} />
      <div className="space-y-3 p-4">
        <Link
          href="/admin"
          className="flex min-h-14 items-center justify-between rounded-card border border-line bg-surface px-4 text-body font-semibold"
        >
          Gestione dati
          <ChevronRight className="size-5 text-muted" aria-hidden />
        </Link>
      </div>
    </main>
  )
}
