import { db } from '@/db'
import { classes, dayOverrides } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { AppHeader } from '@/components/AppHeader'
import { FormSheet } from '@/components/FormSheet'
import { ClassChip } from '@/components/LessonRow'
import { overrideLabel } from '@/components/tokens'
import { OverrideForm } from './OverrideForm'
import { DeleteButton } from '../DeleteButton'
import { deleteOverride } from '../actions'

export const dynamic = 'force-dynamic'

export default async function OverridesPage() {
  const [rows, classesData] = await Promise.all([
    db.select().from(dayOverrides).orderBy(desc(dayOverrides.date), desc(dayOverrides.hour)),
    db.select().from(classes).orderBy(classes.code),
  ])
  const classById = new Map(classesData.map(c => [c.id, c]))
  const options = classesData.map(c => ({ id: c.id, code: c.code }))

  return (
    <main className="mx-auto max-w-xl">
      <AppHeader
        title="Modifiche giornaliere"
        back="/altro"
        action={
          <FormSheet title="Nuova modifica" description="Supplenza, assemblea, sciopero o altra variazione per un giorno." triggerLabel="Aggiungi">
            <OverrideForm classes={options} />
          </FormSheet>
        }
      />
      <div className="p-4">
        {rows.length === 0 ? (
          <div className="rounded-card border border-line bg-surface px-4 py-8 text-center">
            <p className="text-heading text-ink">Nessuna modifica registrata</p>
            <p className="mt-1 text-small text-muted">Una modifica sostituisce o annulla un’ora dell’orario in un giorno preciso.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {rows.map(r => {
              const cls = r.classId ? classById.get(r.classId) : null
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2">
                  <div className="min-w-0 flex-1 py-1">
                    <p className="text-small text-muted">
                      <span className="capitalize">{format(parseISO(r.date), 'EEE d MMM yyyy', { locale: it })}</span>
                      {r.hour != null && <span> · {r.hour}ª ora</span>}
                    </p>
                    <p className="flex items-center gap-2 text-body font-semibold text-ink">
                      {overrideLabel(r.kind)}
                      {cls && <ClassChip code={cls.code} color={cls.color} />}
                    </p>
                    {r.note && <p className="truncate text-small text-muted">{r.note}</p>}
                  </div>
                  <DeleteButton id={r.id} action={deleteOverride} what="la modifica" />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
