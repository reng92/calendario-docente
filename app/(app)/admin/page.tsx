import Link from 'next/link'
import { ChevronRight, ClipboardList, Flag, Repeat } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'

const SECTIONS = [
  { href: '/admin/meetings', icon: ClipboardList, label: 'Impegni pomeridiani', desc: 'Collegi, consigli di classe, scrutini, colloqui' },
  { href: '/admin/overrides', icon: Repeat, label: 'Modifiche giornaliere', desc: 'Supplenze, assemblee, scioperi, progetti' },
  { href: '/admin/holidays', icon: Flag, label: 'Festività', desc: 'Sospensioni delle lezioni' },
]

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-xl">
      <AppHeader title="Gestione" back="/altro" />
      <div className="p-4">
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {SECTIONS.map(({ href, icon: Icon, label, desc }) => (
            <li key={href}>
              <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-ink">{label}</span>
                  <span className="block text-small text-muted">{desc}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 px-1 text-small text-muted">
          Orario settimanale, classi e compresenze si aggiornano dal seed (<code className="rounded bg-surface-2 px-1">pnpm db:seed</code>).
        </p>
      </div>
    </main>
  )
}
