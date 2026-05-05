'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { RenderedDay } from '@/lib/calendar-engine'
import { DayCard } from './DayCard'
import { MonthGrid } from './MonthGrid'

export function CalendarView({ days }: { days: RenderedDay[] }) {
  const [showPast, setShowPast] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  const pastDays = days.filter(d => d.date < today && d.weekday <= 4)
  const visibleDays = (showPast ? days : days.filter(d => d.date >= today)).filter(
    d => d.weekday <= 4,
  )

  return (
    <>
      {/* Mobile: vertical day cards */}
      <div className="md:hidden p-3 space-y-2">
        {pastDays.length > 0 && (
          <button
            onClick={() => setShowPast(v => !v)}
            className="w-full text-xs text-stone-500 hover:text-stone-700 py-2 flex items-center justify-center gap-1"
          >
            {showPast
              ? '▲ Nascondi giorni passati'
              : `▼ Mostra ${pastDays.length} giorni passati`}
          </button>
        )}
        {visibleDays.map(d => (
          <DayCard key={d.date} day={d} />
        ))}
      </div>

      {/* Desktop: Google Calendar-style monthly grid */}
      <div className="hidden md:block p-4 lg:p-6">
        <MonthGrid days={days} />
      </div>
    </>
  )
}
