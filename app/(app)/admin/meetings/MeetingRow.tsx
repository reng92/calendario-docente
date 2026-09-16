'use client'

import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Pencil } from 'lucide-react'
import { deleteMeeting } from '../actions'
import { DeleteButton } from '../DeleteButton'
import { FormSheet } from '@/components/FormSheet'
import { MeetingForm } from './MeetingForm'
import { eventColor, eventLabel } from '@/components/tokens'
import { cn } from '@/components/utils'

type Meeting = {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  kind: string
  title: string
  notes: string | null
}

export function MeetingRow({ m, past }: { m: Meeting; past?: boolean }) {
  const when = format(parseISO(m.date), 'EEE d MMM yyyy', { locale: it })
  const time = m.startTime ? `${m.startTime.slice(0, 5)}${m.endTime ? `–${m.endTime.slice(0, 5)}` : ''}` : null
  return (
    <li className={cn('flex items-center gap-2 px-3 py-2', past && 'opacity-60')}>
      <div aria-hidden className="h-10 w-1 shrink-0 rounded-full" style={{ background: eventColor(m.kind) }} />
      <div className="min-w-0 flex-1 py-1">
        <p className="text-small text-muted">
          <span className="capitalize">{when}</span>
          {time && <span className="tabular"> · {time}</span>}
          <span> · {eventLabel(m.kind)}</span>
        </p>
        <p className="truncate text-body font-semibold text-ink">{m.title}</p>
        {m.notes && <p className="truncate text-small text-warn">{m.notes}</p>}
      </div>
      <FormSheet title="Modifica impegno" triggerVariant="text" triggerClassName="size-11 px-0 rounded-full text-muted hover:text-ink" triggerContent={<Pencil className="size-5" aria-hidden />}>
        <MeetingForm initial={m} />
      </FormSheet>
      <DeleteButton id={m.id} action={deleteMeeting} what="l’impegno" />
    </li>
  )
}
