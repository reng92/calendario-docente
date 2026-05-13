'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import type { RenderedDay } from '@/lib/calendar-engine'
import { DayCard } from './DayCard'

function getRomeNow(d: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10),
  }
}

function groupByWeek(days: RenderedDay[]): RenderedDay[][] {
  const weekdays = days.filter(d => d.weekday <= 4)
  const result: RenderedDay[][] = []
  let current: RenderedDay[] = []
  for (const day of weekdays) {
    if (day.weekday === 0 && current.length > 0) {
      result.push(current)
      current = []
    }
    current.push(day)
  }
  if (current.length > 0) result.push(current)
  return result
}

function weekLabel(week: RenderedDay[]): string {
  const first = parseISO(week[0].date)
  const last = parseISO(week[week.length - 1].date)
  const fm = format(first, 'MMMM', { locale: it })
  const lm = format(last, 'MMMM', { locale: it })
  if (fm === lm) return `${format(first, 'd')}–${format(last, 'd MMMM', { locale: it })}`
  return `${format(first, 'd MMM', { locale: it })} – ${format(last, 'd MMM', { locale: it })}`
}

export function CalendarView({ days }: { days: RenderedDay[] }) {
  const [showPast, setShowPast] = useState(false)
  const [now, setNow] = useState<{ date: string; minutes: number } | undefined>(undefined)
  useEffect(() => {
    const tick = () => setNow(getRomeNow(new Date()))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])
  const today = now?.date ?? '0000-01-01'

  const pastDays = days.filter(d => d.date < today && d.weekday <= 4)
  const visibleDays = (showPast ? days : days.filter(d => d.date >= today)).filter(
    d => d.weekday <= 4,
  )

  const allWeeks = groupByWeek(days)
  const pastWeeks = allWeeks.filter(w => w[w.length - 1].date < today)
  const visibleWeeks = showPast ? allWeeks : allWeeks.filter(w => w[w.length - 1].date >= today)

  const byMonth: { month: string; weeks: RenderedDay[][] }[] = []
  for (const week of visibleWeeks) {
    const month = format(parseISO(week[0].date), 'MMMM yyyy', { locale: it })
    const last = byMonth[byMonth.length - 1]
    if (last && last.month === month) last.weeks.push(week)
    else byMonth.push({ month, weeks: [week] })
  }

  return (
    <>
      {/* Mobile: single-column vertical list */}
      <div className="md:hidden p-3 space-y-2">
        {pastDays.length > 0 && (
          <button
            onClick={() => setShowPast(v => !v)}
            className="w-full text-xs text-stone-500 hover:text-stone-700 py-2 flex items-center justify-center gap-1"
          >
            {showPast ? '▲ Nascondi giorni passati' : `▼ Mostra ${pastDays.length} giorni passati`}
          </button>
        )}
        {visibleDays.map(d => <DayCard key={d.date} day={d} now={now} />)}
      </div>

      {/* Desktop: 5-column week rows, full DayCard detail */}
      <div className="hidden md:block p-4 lg:p-6 space-y-8">
        {pastWeeks.length > 0 && (
          <button
            onClick={() => setShowPast(v => !v)}
            className="text-xs text-stone-500 hover:text-stone-700 py-1 flex items-center gap-1"
          >
            {showPast ? '▲ Nascondi settimane passate' : `▼ Mostra ${pastWeeks.length} settimane passate`}
          </button>
        )}
        {byMonth.map(({ month, weeks }) => (
          <section key={month}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 capitalize">
              {month}
            </h2>
            <div className="space-y-3">
              {weeks.map(week => (
                <div key={week[0].date}>
                  <p className="text-[11px] text-stone-400 font-medium mb-1.5">{weekLabel(week)}</p>
                  <div className="grid grid-cols-5 gap-2">
                    {week.map(day => <DayCard key={day.date} day={day} now={now} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
