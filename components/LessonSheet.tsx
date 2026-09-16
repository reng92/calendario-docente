'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { X } from 'lucide-react'
import type { RenderedSlot } from '@/lib/calendar-engine'
import { HOUR_EFFECTIVE_START, HOUR_END, HOUR_START } from '@/lib/schedule'
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet'
import { isDisposizione, overrideLabel } from '@/components/tokens'
import { ClassChip } from '@/components/LessonRow'

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  slot: RenderedSlot
  date: string
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === '') return null
  return (
    <div className="flex min-h-11 items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <dt className="shrink-0 text-small text-muted">{label}</dt>
      <dd className="text-right text-body font-semibold text-ink">{value}</dd>
    </div>
  )
}

export function LessonSheet({ open, onOpenChange, slot, date }: Props) {
  const code = slot.class?.code ?? '—'
  const disp = isDisposizione(slot.class?.code)
  const isOverride = slot.kind !== 'lesson'
  const nominal = `${HOUR_START[slot.hour]?.replace(/^0/, '')}–${HOUR_END[slot.hour]?.replace(/^0/, '')}`
  const effective = HOUR_EFFECTIVE_START[slot.hour]
  const startsLate = effective && effective !== HOUR_START[slot.hour]
  const dayLabel = format(parseISO(date), 'EEEE d MMMM', { locale: it })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-w-xl rounded-t-[20px] border-line px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetDescription className="text-small capitalize text-muted">
              {dayLabel} · {slot.hour}ª ora
            </SheetDescription>
            <SheetTitle className="mt-1 flex items-center gap-2 text-title text-ink">
              <ClassChip code={code} color={slot.class?.color} muted={disp} className="h-7 text-small" />
              <span className="truncate">{disp ? 'Propria classe' : slot.subject ?? 'Lezione'}</span>
            </SheetTitle>
          </div>
          <SheetClose
            aria-label="Chiudi"
            className="-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-5" />
          </SheetClose>
        </div>

        {isOverride && (
          <div className="mt-3 rounded-control bg-warn-soft px-3 py-2 text-small text-warn">
            <span className="font-semibold">{overrideLabel(slot.kind)}</span>
            {slot.note && <span> · {slot.note}</span>}
          </div>
        )}

        <dl className="mt-3">
          <Row label="Orario" value={<span className="tabular">{nominal}</span>} />
          {startsLate && <Row label="Inizio effettivo" value={<span className="tabular">{effective.replace(/^0/, '')}</span>} />}
          {!disp && <Row label="Aula" value={slot.room} />}
          {!disp && <Row label="Classe" value={code} />}
          {slot.coteachers.length > 0 && (
            <Row label="In compresenza con" value={slot.coteachers.map(c => c.name).join(', ')} />
          )}
        </dl>

        <Link
          href="/admin/overrides"
          onClick={() => onOpenChange(false)}
          className="mt-4 flex min-h-11 items-center justify-center rounded-control border border-line text-small font-semibold text-ink hover:bg-surface-2"
        >
          Registra una variazione per questo giorno
        </Link>
      </SheetContent>
    </Sheet>
  )
}
