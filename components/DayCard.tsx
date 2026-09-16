import type { RenderedDay } from '@/lib/calendar-engine'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { BREAKS } from '@/lib/schedule'
import { cn } from '@/components/utils'
import { LessonRow, BreakRow } from '@/components/LessonRow'
import { MeetingRow } from '@/components/MeetingRow'
import { slotState, type RomeNow } from '@/components/now'
import { timeToMin } from '@/lib/schedule'

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function DayCard({ day, now }: { day: RenderedDay; now?: RomeNow }) {
  const date = parseISO(day.date)
  const dayNum = format(date, 'd')
  const weekdayName = format(date, 'EEEE', { locale: it })
  const monthName = format(date, 'MMMM', { locale: it })
  const isToday = !!now && day.date === now.date
  const isPast = !!now && day.date < now.date
  const empty = !day.isHoliday && day.slots.length === 0 && day.meetings.length === 0

  const nextHour = isToday
    ? day.slots.find(s => slotState(s.hour, day.date, now) === 'future')?.hour
    : undefined

  const isMeetingPast = (m: { startTime: string | null; endTime: string | null }) => {
    if (!now) return false
    if (isPast) return true
    if (!isToday) return false
    const end = m.endTime ?? m.startTime
    return end ? now.minutes >= timeToMin(end) : false
  }

  return (
    <article
      aria-current={isToday ? 'date' : undefined}
      className={cn(
        'overflow-hidden rounded-card border bg-surface',
        isToday ? 'border-accent' : 'border-line',
        day.isHoliday && 'bg-surface-2',
        isPast && 'opacity-70',
      )}
    >
      <header className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className={cn('text-display tabular leading-none', isToday ? 'text-accent' : 'text-ink')}>{dayNum}</div>
        <div className="min-w-0 leading-tight">
          <div className={cn('text-heading', isToday ? 'text-accent' : 'text-ink')}>
            {isToday ? 'Oggi' : cap(weekdayName)}
          </div>
          <div className="text-small text-muted">
            {isToday ? `${cap(weekdayName)} · ${monthName}` : monthName}
          </div>
        </div>
      </header>

      <div className="px-2 pb-2">
        {day.isHoliday && (
          <p className="px-2 py-2 text-small font-semibold text-danger">{day.holidayLabel}</p>
        )}

        {empty && (
          <p className="px-2 py-2 text-small text-muted">Nessuna lezione in orario.</p>
        )}

        {day.slots.length > 0 && (
          <div>
            {day.slots.map((s, idx) => (
              <div key={`${s.hour}-${s.class?.id ?? 'x'}`}>
                <LessonRow slot={s} date={day.date} state={slotState(s.hour, day.date, now, nextHour)} />
                {BREAKS[s.hour] && idx < day.slots.length - 1 && <BreakRow label={BREAKS[s.hour]} />}
              </div>
            ))}
          </div>
        )}

        {day.meetings.length > 0 && (
          <div className={cn(day.slots.length > 0 && 'mt-1 border-t border-line pt-1')}>
            <p className="px-2 pt-1 pb-0.5 text-caption text-muted">Pomeriggio</p>
            {day.meetings.map(m => (
              <MeetingRow key={m.id} m={m} past={isMeetingPast(m)} />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
