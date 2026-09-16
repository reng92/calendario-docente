'use client'

import { useState } from 'react'
import type { RenderedSlot } from '@/lib/calendar-engine'
import { HOUR_EFFECTIVE_START, HOUR_END } from '@/lib/schedule'
import { cn } from '@/components/utils'
import { classVar, isDisposizione, OVERRIDE_KINDS } from '@/components/tokens'
import type { SlotState } from '@/components/now'
import { LessonSheet } from '@/components/LessonSheet'

type Props = {
  slot: RenderedSlot
  date: string
  state?: SlotState
  /** Variante compatta (usata nelle anteprime dei prossimi giorni) */
  compact?: boolean
}

function stripLeadingZero(t: string): string {
  return t.replace(/^0/, '')
}

export function ClassChip({ code, color, muted, className }: { code: string; color?: string | null; muted?: boolean; className?: string }) {
  return (
    <span
      style={muted ? undefined : classVar(color)}
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-chip px-1.5 text-caption tabular',
        muted ? 'border border-dashed border-muted/60 text-muted' : 'chip-class',
        className,
      )}
    >
      {code}
    </span>
  )
}

export function LessonRow({ slot, date, state = 'future', compact }: Props) {
  const [open, setOpen] = useState(false)
  const code = slot.class?.code ?? '—'
  const disp = isDisposizione(slot.class?.code)
  const isOverride = slot.kind !== 'lesson'
  const overrideLabel = isOverride ? OVERRIDE_KINDS[slot.kind]?.short ?? 'Variazione' : null
  const start = stripLeadingZero(HOUR_EFFECTIVE_START[slot.hour] ?? '')
  const end = stripLeadingZero(HOUR_END[slot.hour] ?? '')
  const cot = slot.coteachers.map(c => c.name).join(', ')

  const secondary = [
    cot ? `con ${cot}` : null,
    isOverride && slot.note ? slot.note : null,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${slot.hour}ª ora, ${code}${slot.subject ? `, ${slot.subject}` : ''}${slot.room ? `, aula ${slot.room}` : ''}`}
        className={cn(
          'group flex w-full items-stretch gap-3 rounded-control px-2 text-left transition-colors active:bg-surface-2',
          compact ? 'min-h-11 py-1' : 'min-h-12 py-1.5',
          state === 'current' && 'bg-accent-soft',
          state === 'past' && 'opacity-55',
        )}
      >
        <div className={cn('flex w-11 shrink-0 flex-col justify-center tabular leading-none', compact ? 'text-caption' : '')}>
          <span className={cn('text-small font-semibold', state === 'current' ? 'text-accent' : 'text-ink')}>{start}</span>
          {!compact && <span className="mt-0.5 text-caption font-normal text-muted">{end}</span>}
        </div>

        <div
          aria-hidden
          style={disp || isOverride ? undefined : classVar(slot.class?.color)}
          className={cn(
            'my-0.5 w-1 shrink-0 rounded-full',
            disp ? 'border-l-2 border-dashed border-muted/50 bg-transparent' : isOverride ? 'bg-warn' : 'bar-class',
          )}
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <ClassChip code={code} color={slot.class?.color} muted={disp} />
            <span className={cn('min-w-0 flex-1 basis-auto break-words', disp ? 'text-small text-muted' : 'text-body font-semibold text-ink', isOverride && 'line-through decoration-muted/60 text-muted')}>
              {slot.subject ?? (isOverride ? '' : 'Lezione')}
            </span>
            {overrideLabel && (
              <span className="shrink-0 rounded-chip bg-warn-soft px-1.5 py-0.5 text-caption text-warn">{overrideLabel}</span>
            )}
            {slot.room && !disp && (
              <span className="ml-auto shrink-0 pl-2 text-body font-semibold tabular text-ink">{slot.room}</span>
            )}
          </div>
          {secondary && !compact && (
            <div className="truncate text-small text-muted">{secondary}</div>
          )}
        </div>
      </button>
      <LessonSheet open={open} onOpenChange={setOpen} slot={slot} date={date} />
    </>
  )
}

export function BreakRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1" aria-label={`Intervallo ${label}`}>
      <div className="w-11 shrink-0" />
      <div className="flex flex-1 items-center gap-2 text-caption font-normal text-muted">
        <span className="h-px flex-1 border-t border-dashed border-line" />
        <span className="tabular">Intervallo {label}</span>
        <span className="h-px flex-1 border-t border-dashed border-line" />
      </div>
    </div>
  )
}
