import { db } from '@/db'
import { holidays } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { AppHeader } from '@/components/AppHeader'
import { FormSheet } from '@/components/FormSheet'
import { getRomeNow } from '@/components/now'
import { cn } from '@/components/utils'
import { HolidayForm } from './HolidayForm'
import { DeleteButton } from '../DeleteButton'
import { deleteHoliday } from '../actions'

export const dynamic = 'force-dynamic'

export default async function HolidaysPage() {
  const now = getRomeNow()
  const rows = await db.select().from(holidays).orderBy(asc(holidays.date))

  return (
    <main className="mx-auto max-w-xl">
      <AppHeader
        title="Festività"
        back="/altro"
        action={
          <FormSheet title="Nuova festività" description="Un giorno senza lezioni: sparisce dal calendario e dalle notifiche." triggerLabel="Aggiungi">
            <HolidayForm />
          </FormSheet>
        }
      />
      <div className="p-4">
        {rows.length === 0 ? (
          <div className="rounded-card border border-line bg-surface px-4 py-8 text-center">
            <p className="text-heading text-ink">Nessuna festività registrata</p>
          </div>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {rows.map(r => {
              const d = parseISO(r.date)
              const past = r.date < now.date
              return (
                <li key={r.id} className={cn('flex items-center gap-3 px-4 py-2', past && 'opacity-60')}>
                  <div className="flex w-12 shrink-0 flex-col items-center leading-none">
                    <span className="text-title tabular text-ink">{format(d, 'd')}</span>
                    <span className="text-caption font-normal text-muted">{format(d, 'MMM', { locale: it })}</span>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <p className="truncate text-body font-semibold text-ink">{r.label}</p>
                    <p className="text-small capitalize text-muted">{format(d, 'EEEE yyyy', { locale: it })}</p>
                  </div>
                  <DeleteButton id={r.id} action={deleteHoliday} what="la festività" />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
