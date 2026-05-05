'use client'

import { useState, useMemo } from 'react'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import { it } from 'date-fns/locale'
import type { RenderedDay } from '@/lib/calendar-engine'

const EVENT_COLORS: Record<string, string> = {
  collegio: '#1A237E',
  dipartimento: '#004D40',
  cdc: '#E65100',
  colloqui: '#37474F',
  scrutini: '#4A148C',
}

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

type Chip = { label: string; textColor: string; bgColor: string }

function buildChips(day: RenderedDay | undefined): Chip[] {
  if (!day || day.isHoliday) return []
  const chips: Chip[] = []
  const seenClasses = new Set<string>()

  for (const s of day.slots) {
    if (s.kind === 'padel') {
      if (!seenClasses.has('padel')) {
        seenClasses.add('padel')
        chips.push({ label: '🎾 PADEL', textColor: '#7c2d12', bgColor: '#fed7aa' })
      }
    } else if (s.class && !seenClasses.has(s.class.id)) {
      seenClasses.add(s.class.id)
      chips.push({ label: s.class.code, textColor: 'white', bgColor: s.class.color })
    }
  }

  for (const m of day.meetings) {
    const col = EVENT_COLORS[m.kind] ?? '#555'
    chips.push({ label: m.title, textColor: col, bgColor: col + '22' })
  }

  return chips
}

export function MonthGrid({ days }: { days: RenderedDay[] }) {
  const dayMap = useMemo(() => new Map(days.map(d => [d.date, d])), [days])

  const availableMonths = useMemo(() => {
    const keys = new Set(days.map(d => d.date.slice(0, 7)))
    return Array.from(keys).sort()
  }, [days])

  const [currentMonthKey, setCurrentMonthKey] = useState(() => {
    const todayKey = format(new Date(), 'yyyy-MM')
    return availableMonths.includes(todayKey) ? todayKey : (availableMonths[0] ?? todayKey)
  })

  const currentIdx = availableMonths.indexOf(currentMonthKey)
  const canPrev = currentIdx > 0
  const canNext = currentIdx < availableMonths.length - 1

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(parseISO(currentMonthKey + '-01'))
    const monthEnd = endOfMonth(monthStart)
    const firstJsDay = getDay(monthStart) // 0=Sun
    const leading = firstJsDay === 0 ? 6 : firstJsDay - 1 // Mon=0

    const cells: (Date | null)[] = []
    for (let i = 0; i < leading; i++) cells.push(null)
    for (const d of eachDayOfInterval({ start: monthStart, end: monthEnd })) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)

    const result: (Date | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7))
    return result
  }, [currentMonthKey])

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
      {/* Month navigation */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200">
        <button
          onClick={() => setCurrentMonthKey(availableMonths[currentIdx - 1])}
          disabled={!canPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 disabled:opacity-30 text-stone-600 text-xl leading-none select-none"
        >
          ‹
        </button>
        <h2 className="flex-1 text-center capitalize font-semibold text-stone-800">
          {format(parseISO(currentMonthKey + '-01'), 'MMMM yyyy', { locale: it })}
        </h2>
        <button
          onClick={() => setCurrentMonthKey(availableMonths[currentIdx + 1])}
          disabled={!canNext}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 disabled:opacity-30 text-stone-600 text-xl leading-none select-none"
        >
          ›
        </button>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-200">
        {WEEKDAY_HEADERS.map((label, i) => (
          <div
            key={label}
            className={`py-2 text-center text-xs font-semibold uppercase tracking-wide ${i >= 5 ? 'text-stone-400' : 'text-stone-500'}`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="divide-y divide-stone-100">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-stone-100">
            {week.map((date, di) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${wi}-${di}`}
                    className="min-h-[110px] bg-stone-50/40"
                  />
                )
              }

              const iso = format(date, 'yyyy-MM-dd')
              const day = dayMap.get(iso)
              const isWeekend = di >= 5
              const today = isToday(date)

              let cellBg = isWeekend ? 'bg-stone-50/60' : 'bg-white'
              if (day?.isHoliday) cellBg = 'bg-red-50'

              const chips = buildChips(day)
              const MAX = 4
              const shown = chips.slice(0, MAX)
              const overflow = chips.length - MAX

              return (
                <div key={iso} className={`min-h-[110px] p-1.5 ${cellBg}`}>
                  {/* Day number */}
                  <div className="mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                        today
                          ? 'bg-blue-600 text-white font-bold'
                          : day?.isHoliday
                          ? 'text-red-500 font-semibold'
                          : isWeekend
                          ? 'text-stone-400 font-medium'
                          : 'text-stone-700 font-semibold'
                      }`}
                    >
                      {format(date, 'd')}
                    </span>
                  </div>

                  {/* Holiday label */}
                  {day?.isHoliday && (
                    <div className="text-[10px] text-red-500 font-medium leading-tight px-0.5 mb-0.5 truncate">
                      {day.holidayLabel}
                    </div>
                  )}

                  {/* Event chips */}
                  <div className="space-y-0.5">
                    {shown.map((chip, i) => (
                      <div
                        key={i}
                        className="text-[11px] font-semibold px-1.5 py-0.5 rounded truncate leading-snug"
                        style={{ background: chip.bgColor, color: chip.textColor }}
                      >
                        {chip.label}
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="text-[10px] text-stone-400 font-medium px-1">
                        +{overflow} altri
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
