'use client'

import { useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Pencil } from 'lucide-react'
import { deleteMeeting, setMeetingAttended } from '../actions'
import { DeleteButton } from '../DeleteButton'
import { FormSheet } from '@/components/FormSheet'
import { MeetingForm } from './MeetingForm'
import { eventColor, eventLabel } from '@/components/tokens'
import { capFirst, cn } from '@/components/utils'
import { commaOf, durataMin, formatOre } from '@/lib/impegni'

type Meeting = {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  kind: string
  title: string
  notes: string | null
  attended: boolean | null
}

export function MeetingRow({ m, past }: { m: Meeting; past?: boolean }) {
  const when = format(parseISO(m.date), 'EEE d MMM yyyy', { locale: it })
  const time = m.startTime ? `${m.startTime.slice(0, 5)}${m.endTime ? `–${m.endTime.slice(0, 5)}` : ''}` : null
  const counted = commaOf(m.kind) !== null
  const durata = durataMin(m.startTime, m.endTime)

  // null = presenza presunta: conta finché non lo segni come assente
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [present, setPresent] = useOptimistic(m.attended !== false)
  function toggle() {
    const next = !present
    startTransition(async () => {
      setPresent(next)
      await setMeetingAttended(m.id, next)
      router.refresh()
    })
  }

  const dim = past || !present
  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <div aria-hidden className={cn('h-10 w-1 shrink-0 rounded-full', dim && 'opacity-40')} style={{ background: eventColor(m.kind) }} />
      <div className="min-w-0 flex-1 py-1">
        <p className="text-small text-muted">
          <span>{capFirst(when)}</span>
          {time && <span className="tabular"> · {time}</span>}
          <span> · {eventLabel(m.kind)}</span>
        </p>
        <p className={cn('truncate text-body font-semibold', dim ? 'text-muted' : 'text-ink')}>{m.title}</p>
        {m.notes && <p className="truncate text-small text-warn">{m.notes}</p>}
        {counted && (
          <button
            type="button"
            role="switch"
            aria-checked={present}
            onClick={toggle}
            className="-ml-1 mt-0.5 inline-flex min-h-11 items-center gap-2 rounded-control px-1 text-small"
          >
            <span
              aria-hidden
              className={cn(
                'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                present ? 'bg-accent' : 'bg-muted/45',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] transition-transform',
                  present && 'translate-x-4',
                )}
              />
            </span>
            <span className={present ? 'font-semibold text-ink' : 'text-muted'}>
              {present ? 'Presente' : 'Assente · non conta'}
            </span>
            {present && durata > 0 && <span className="tabular text-muted">{formatOre(durata)}</span>}
          </button>
        )}
      </div>
      <FormSheet title="Modifica impegno" triggerVariant="text" triggerClassName="size-11 px-0 rounded-full text-muted hover:text-ink" triggerContent={<Pencil className="size-5" aria-hidden />}>
        <MeetingForm initial={m} />
      </FormSheet>
      <DeleteButton id={m.id} action={deleteMeeting} what="l’impegno" />
    </li>
  )
}
