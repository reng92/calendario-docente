import { eventColor, eventLabel } from '@/components/tokens'
import { cn } from '@/components/utils'

export type MeetingLike = {
  id: string
  startTime: string | null
  endTime: string | null
  kind: string
  title: string
  notes: string | null
}

export function MeetingRow({ m, past, compact }: { m: MeetingLike; past?: boolean; compact?: boolean }) {
  const start = m.startTime?.slice(0, 5)
  const end = m.endTime?.slice(0, 5)
  return (
    <div
      className={cn('flex items-stretch gap-3 rounded-control px-2', compact ? 'min-h-10 py-1' : 'min-h-12 py-1.5', past && 'opacity-55')}
      style={{ ['--ev' as string]: eventColor(m.kind) }}
    >
      <div className="flex w-11 shrink-0 flex-col justify-center tabular leading-none">
        <span className="text-small font-semibold text-ink">{start ?? '—'}</span>
        {!compact && end && <span className="mt-0.5 text-caption font-normal text-muted">{end}</span>}
      </div>
      <div aria-hidden className="my-0.5 w-1 shrink-0 rounded-full" style={{ background: 'var(--ev)' }} />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate text-body font-semibold text-ink">{m.title}</span>
          <span className="ml-auto shrink-0 text-caption font-semibold" style={{ color: 'var(--ev)' }}>
            {eventLabel(m.kind)}
          </span>
        </div>
        {m.notes && !compact && (
          <div className="truncate text-small text-warn">{m.notes}</div>
        )}
      </div>
    </div>
  )
}
