'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, format, parseISO, startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RenderedDay } from '@/lib/calendar-engine'
import { DayCard } from '@/components/DayCard'
import { ClassChip } from '@/components/LessonRow'
import { getRomeNow, type RomeNow } from '@/components/now'
import { eventColor, isDisposizione } from '@/components/tokens'
import { cn } from '@/components/utils'

type Mode = 'week' | 'month'

function mondayOf(iso: string): string {
  const d = parseISO(iso)
  const js = d.getDay()
  const diff = js === 0 ? -6 : 1 - js
  return format(addDays(d, diff), 'yyyy-MM-dd')
}

function weekLabel(monday: string): string {
  const first = parseISO(monday)
  const last = addDays(first, 4)
  const fm = format(first, 'MMMM', { locale: it })
  const lm = format(last, 'MMMM', { locale: it })
  if (fm === lm) return `${format(first, 'd')}–${format(last, 'd MMMM yyyy', { locale: it })}`
  return `${format(first, 'd MMM', { locale: it })} – ${format(last, 'd MMM yyyy', { locale: it })}`
}

const NAV_BTN = 'flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-2 disabled:opacity-30'

export function CalendarView({ days, initialNow }: { days: RenderedDay[]; initialNow: RomeNow }) {
  const [now, setNow] = useState<RomeNow>(initialNow)
  useEffect(() => {
    const tick = () => setNow(getRomeNow())
    const id = setInterval(tick, 60_000)
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const byDate = useMemo(() => new Map(days.map(d => [d.date, d])), [days])
  const first = days[0]?.date ?? now.date
  const last = days[days.length - 1]?.date ?? now.date
  const firstMonday = mondayOf(first)
  const lastMonday = mondayOf(last)

  const [mode, setMode] = useState<Mode>('week')
  const [monday, setMonday] = useState<string>(() => {
    const m = mondayOf(now.date)
    return m < firstMonday ? firstMonday : m > lastMonday ? lastMonday : m
  })
  const [month, setMonth] = useState<string>(() => now.date.slice(0, 7))

  const weekDays = useMemo(
    () => [0, 1, 2, 3, 4].map(i => byDate.get(format(addDays(parseISO(monday), i), 'yyyy-MM-dd'))).filter(Boolean) as RenderedDay[],
    [byDate, monday],
  )

  const isCurrentWeek = monday === mondayOf(now.date)

  // Al primo render della settimana corrente porta in vista la card di oggi (solo colonna singola)
  const scrolled = useRef(false)
  useEffect(() => {
    if (scrolled.current || mode !== 'week' || !isCurrentWeek) return
    scrolled.current = true
    if (window.matchMedia('(min-width: 768px)').matches) return
    const el = document.querySelector('[aria-current="date"]')
    if (el) el.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [mode, isCurrentWeek])

  function goToday() {
    setMonday(mondayOf(now.date))
    setMonth(now.date.slice(0, 7))
  }

  return (
    <div className="p-4 pt-3">
      {/* Selettore */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1">
          <button
            type="button"
            aria-label={mode === 'week' ? 'Settimana precedente' : 'Mese precedente'}
            className={NAV_BTN}
            disabled={mode === 'week' ? monday <= firstMonday : month <= first.slice(0, 7)}
            onClick={() => mode === 'week'
              ? setMonday(format(addDays(parseISO(monday), -7), 'yyyy-MM-dd'))
              : setMonth(format(addMonths(parseISO(month + '-01'), -1), 'yyyy-MM'))}
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-heading text-ink">
              {mode === 'week' ? weekLabel(monday) : format(parseISO(month + '-01'), 'MMMM yyyy', { locale: it })}
            </div>
          </div>
          <button
            type="button"
            aria-label={mode === 'week' ? 'Settimana successiva' : 'Mese successivo'}
            className={NAV_BTN}
            disabled={mode === 'week' ? monday >= lastMonday : month >= last.slice(0, 7)}
            onClick={() => mode === 'week'
              ? setMonday(format(addDays(parseISO(monday), 7), 'yyyy-MM-dd'))
              : setMonth(format(addMonths(parseISO(month + '-01'), 1), 'yyyy-MM'))}
          >
            <ChevronRight className="size-6" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div role="tablist" aria-label="Vista" className="flex flex-1 rounded-control bg-surface-2 p-0.5">
          {(['week', 'month'] as Mode[]).map(m => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                'min-h-11 flex-1 rounded-[8px] text-small font-semibold transition-colors',
                mode === m ? 'bg-surface text-ink shadow-[0_1px_0_var(--line)]' : 'text-muted',
              )}
            >
              {m === 'week' ? 'Settimana' : 'Mese'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={goToday}
          disabled={mode === 'week' ? isCurrentWeek : month === now.date.slice(0, 7)}
          className="min-h-11 rounded-control border border-line px-3 text-small font-semibold text-accent disabled:opacity-40"
        >
          Oggi
        </button>
      </div>

      {mode === 'week' ? (
        <div className="grid gap-3 md:grid-cols-5 md:gap-2">
          {weekDays.map(d => <DayCard key={d.date} day={d} now={now} />)}
        </div>
      ) : (
        <MonthView month={month} byDate={byDate} now={now} onPickDay={iso => { setMonday(mondayOf(iso)); setMode('week') }} />
      )}
    </div>
  )
}

function MonthView({ month, byDate, now, onPickDay }: {
  month: string
  byDate: Map<string, RenderedDay>
  now: RomeNow
  onPickDay: (iso: string) => void
}) {
  const start = startOfMonth(parseISO(month + '-01'))
  const end = endOfMonth(start)
  // celle: solo lun–ven, allineate per colonna
  const firstJs = start.getDay()
  const lead = firstJs === 0 ? 6 : firstJs - 1 // 0 = lunedì
  const cells: (string | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = start; d <= end; d = addDays(d, 1)) cells.push(format(d, 'yyyy-MM-dd'))
  const rows: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="grid grid-cols-5 border-b border-line bg-surface-2 text-center text-caption text-muted">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven'].map(w => <div key={w} className="py-2">{w}</div>)}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-5 border-b border-line last:border-b-0">
          {row.slice(0, 5).map((iso, ci) => {
            if (!iso) return <div key={ci} className="min-h-20 border-r border-line last:border-r-0 bg-surface-2/50" />
            const day = byDate.get(iso)
            const isToday = iso === now.date
            const isPast = iso < now.date
            const lessons = (day?.slots ?? []).filter(s => !isDisposizione(s.class?.code))
            const seen = new Set<string>()
            const chips = lessons.filter(s => s.class && !seen.has(s.class.id) && seen.add(s.class.id))
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onPickDay(iso)}
                aria-label={format(parseISO(iso), 'EEEE d MMMM', { locale: it })}
                className={cn(
                  'flex min-h-20 flex-col items-stretch gap-1 border-r border-line p-1.5 text-left last:border-r-0 hover:bg-surface-2',
                  day?.isHoliday && 'bg-danger-soft/40',
                  isPast && 'opacity-55',
                )}
              >
                <span className={cn(
                  'self-start rounded-full px-1.5 text-small tabular leading-6',
                  isToday ? 'bg-accent font-semibold text-accent-ink' : 'text-ink',
                )}>
                  {parseInt(iso.slice(8), 10)}
                </span>
                {day?.isHoliday ? (
                  <span className="truncate text-caption font-normal text-danger">{day.holidayLabel}</span>
                ) : (
                  <>
                    <span className="flex flex-wrap gap-0.5">
                      {chips.map(s => (
                        <ClassChip key={s.class!.id} code={s.class!.code} color={s.class!.color} className="h-5 px-1 text-[12px]" />
                      ))}
                    </span>
                    {(day?.meetings ?? []).slice(0, 2).map(m => (
                      <span key={m.id} className="truncate text-caption font-normal" style={{ color: eventColor(m.kind) }}>
                        {m.title}
                      </span>
                    ))}
                  </>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
