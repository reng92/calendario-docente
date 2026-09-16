import Link from 'next/link'
import { CalendarPlus, ChevronRight, ClipboardList, Flag, Palette, Repeat } from 'lucide-react'
import { db } from '@/db'
import { holidays, weeklySlots } from '@/db/schema'
import { AppHeader } from '@/components/AppHeader'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PushSubscribeButton } from '@/components/PushSubscribeButton'
import { InstallCard } from '@/components/InstallCard'
import { getRomeNow } from '@/components/now'
import { LESSONS_END, LESSONS_END_LABEL, SCHOOL_NAME, SCHOOL_CITY } from '@/lib/schedule'
import { eachDayOfInterval, parseISO, format } from 'date-fns'

export const dynamic = 'force-dynamic'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="px-1 pb-2 text-caption text-muted">{title}</h2>
      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">{children}</div>
    </section>
  )
}

function NavRow({ href, icon: Icon, label, hint, external }: {
  href: string; icon: typeof Flag; label: string; hint?: string; external?: boolean
}) {
  const cls = 'flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-surface-2'
  const inner = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-ink">{label}</span>
        {hint && <span className="block text-small text-muted">{hint}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </>
  )
  return external
    ? <a href={href} className={cls}>{inner}</a>
    : <Link href={href} className={cls}>{inner}</Link>
}

export default async function AltroPage() {
  const now = getRomeNow()
  const [hol, slots] = await Promise.all([
    db.select({ date: holidays.date }).from(holidays),
    db.select({ weekday: weeklySlots.weekday }).from(weeklySlots),
  ])
  const holidaySet = new Set(hol.map(h => h.date))
  const lessonWeekdays = new Set(slots.map(s => s.weekday))
  const remaining = now.date <= LESSONS_END
    ? eachDayOfInterval({ start: parseISO(now.date), end: parseISO(LESSONS_END) }).filter(d => {
        const js = d.getDay()
        const wd = js === 0 ? 6 : js - 1
        return wd <= 4 && lessonWeekdays.has(wd) && !holidaySet.has(format(d, 'yyyy-MM-dd'))
      }).length
    : 0

  return (
    <main className="mx-auto max-w-xl">
      <AppHeader title="Altro" />
      <div className="space-y-5 p-4">
        <Section title="Notifiche">
          <PushSubscribeButton />
        </Section>

        <Section title="Aspetto">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
              <Palette className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <ThemeToggle />
            </div>
          </div>
        </Section>

        <Section title="App">
          <InstallCard />
          <NavRow
            href="/api/export/ics"
            icon={CalendarPlus}
            label="Esporta impegni e festività"
            hint="File ICS per Google Calendar, Apple Calendario, Outlook"
            external
          />
        </Section>

        <Section title="Gestione">
          <NavRow href="/admin/meetings" icon={ClipboardList} label="Impegni pomeridiani" hint="Collegi, consigli di classe, scrutini, colloqui" />
          <NavRow href="/admin/overrides" icon={Repeat} label="Modifiche giornaliere" hint="Supplenze, assemblee, scioperi, progetti" />
          <NavRow href="/admin/holidays" icon={Flag} label="Festività" hint="Sospensioni delle lezioni" />
        </Section>

        <section className="px-1 text-small text-muted">
          <p className="text-ink">{SCHOOL_NAME} · {SCHOOL_CITY}</p>
          <p>Anno scolastico 2026/27 · ultimo giorno di lezione {LESSONS_END_LABEL}</p>
          <p className="tabular">{remaining} giorni di lezione rimanenti</p>
          <p className="mt-2">Orario settimanale, classi e compresenze si aggiornano con <code className="rounded bg-surface-2 px-1">pnpm db:seed</code>.</p>
        </section>
      </div>
    </main>
  )
}
