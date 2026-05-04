import type { RenderedDay } from '@/lib/calendar-engine'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

const HOUR_TIMES: Record<number, string> = {
  1: '8:00', 2: '9:00', 3: '10:00', 4: '11:00',
  5: '12:00', 6: '13:00', 7: '14:00',
}

const EVENT_COLORS: Record<string, string> = {
  collegio: '#1A237E',
  dipartimento: '#004D40',
  cdc: '#E65100',
  colloqui: '#37474F',
  scrutini: '#4A148C',
}

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven']
const BREAK_AFTER = new Set([3, 5])

function shortTeacher(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return name
  if (['De', 'Di', 'Del', 'Della', 'Lo', 'La'].includes(parts[0]) && parts.length >= 2)
    return `${parts[0]} ${parts[1]}`
  return parts[0]
}

export function WeekGrid({ week }: { week: RenderedDay[] }) {
  const dayByWd = new Map<number, RenderedDay>(week.map(d => [d.weekday, d]))

  const usedHours = new Set<number>()
  for (const day of week) for (const s of day.slots) usedHours.add(s.hour)
  const hours = [1, 2, 3, 4, 5, 6, 7].filter(h => usedHours.has(h))

  const hasMeetings = week.some(d => d.meetings.length > 0)

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden grid"
      style={{ gridTemplateColumns: '3.5rem repeat(5, minmax(0, 1fr))' }}
    >
      {/* Header row */}
      <div className="bg-stone-50 border-b-2 border-r border-stone-200" />
      {[0, 1, 2, 3, 4].map(wd => {
        const day = dayByWd.get(wd)
        const isHoliday = day?.isHoliday ?? false
        return (
          <div
            key={wd}
            className={`border-l border-b-2 border-stone-200 px-2 py-2 text-center ${isHoliday ? 'bg-red-50' : 'bg-stone-50'}`}
          >
            {day ? (
              <>
                <div className={`text-xs font-bold ${isHoliday ? 'text-red-700' : 'text-stone-600'}`}>
                  {WEEKDAY_NAMES[wd]}
                </div>
                <div className={`text-[10px] ${isHoliday ? 'text-red-400' : 'text-stone-400'}`}>
                  {format(parseISO(day.date), 'd MMM', { locale: it })}
                </div>
              </>
            ) : (
              <div className="text-xs text-stone-300">{WEEKDAY_NAMES[wd]}</div>
            )}
          </div>
        )
      })}

      {/* Hour rows */}
      {hours.flatMap((hour, idx) => [
        <div
          key={`t-${hour}`}
          className={`bg-stone-50 border-r border-stone-100 px-1 py-2.5 flex flex-col items-center justify-center text-center ${BREAK_AFTER.has(hour) ? 'border-b-2 border-b-stone-300' : 'border-b border-b-stone-100'}`}
        >
          <span className="text-[11px] font-bold text-stone-500">{hour}ª</span>
          <span className="text-[9px] text-stone-400 leading-tight">{HOUR_TIMES[hour]}</span>
        </div>,

        ...[0, 1, 2, 3, 4].map(wd => {
          const day = dayByWd.get(wd)
          const borderB = BREAK_AFTER.has(hour)
            ? 'border-b-2 border-b-stone-300'
            : 'border-b border-b-stone-100'
          const base = `border-l border-stone-100 px-1.5 py-2 ${borderB}`

          if (!day) return <div key={`${hour}-${wd}`} className={base} />

          if (day.isHoliday) {
            return (
              <div key={`${hour}-${wd}`} className={`${base} bg-red-50 flex items-center justify-center`}>
                {idx === 0 && (
                  <span className="text-[9px] text-red-500 font-semibold text-center leading-tight">
                    🚫 {day.holidayLabel}
                  </span>
                )}
              </div>
            )
          }

          const slot = day.slots.find(s => s.hour === hour)
          if (!slot) return <div key={`${hour}-${wd}`} className={base} />

          if (slot.kind === 'padel') {
            return (
              <div
                key={`${hour}-${wd}`}
                className={`${base} bg-orange-50 flex flex-col items-center justify-center gap-0.5`}
              >
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1 py-0.5 rounded leading-none">
                  🎾
                </span>
                <span className="text-[9px] text-orange-600 line-through">{slot.class?.code}</span>
              </div>
            )
          }

          return (
            <div key={`${hour}-${wd}`} className={`${base} space-y-0.5`}>
              {slot.class && (
                <div
                  className="text-white text-[11px] font-bold px-1 py-0.5 rounded text-center leading-none"
                  style={{ background: slot.class.color }}
                >
                  {slot.class.code}
                </div>
              )}
              {slot.coteachers.slice(0, 2).map((c, i) => (
                <div key={i} className="text-[9px] text-stone-500 truncate leading-tight">
                  {shortTeacher(c.name)}
                </div>
              ))}
            </div>
          )
        }),
      ])}

      {/* Meetings row */}
      {hasMeetings && (
        <>
          <div className="bg-stone-50 border-t-2 border-r border-stone-300 px-1 pt-2 pb-2 flex items-start justify-center">
            <span className="text-[9px] font-bold text-stone-400 text-center uppercase tracking-wide leading-tight">
              🕒{' '}PM
            </span>
          </div>
          {[0, 1, 2, 3, 4].map(wd => {
            const day = dayByWd.get(wd)
            return (
              <div key={`pm-${wd}`} className="border-l border-t-2 border-stone-300 px-1.5 py-2 space-y-1">
                {(day?.meetings ?? []).map(m => (
                  <div
                    key={m.id}
                    className="rounded px-1.5 py-1 text-[9px] font-semibold leading-tight"
                    style={{
                      color: EVENT_COLORS[m.kind] ?? '#444',
                      borderLeft: `2px solid ${EVENT_COLORS[m.kind] ?? '#888'}`,
                      background: `${EVENT_COLORS[m.kind] ?? '#888'}18`,
                    }}
                  >
                    <div className="truncate">{m.title}</div>
                    {(m.startTime || m.endTime) && (
                      <div className="opacity-60">
                        {m.startTime?.slice(0, 5)}
                        {m.endTime && `–${m.endTime.slice(0, 5)}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
