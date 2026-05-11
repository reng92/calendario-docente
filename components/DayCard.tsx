import type { RenderedDay, RenderedSlot } from '@/lib/calendar-engine'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

const EVENT_COLORS: Record<string, string> = {
  collegio: '#1A237E',
  dipartimento: '#004D40',
  cdc: '#E65100',
  colloqui: '#37474F',
  scrutini: '#4A148C',
}

const BREAKS: Record<number, string> = {
  3: '10:45–11:00',
  5: '13:00–13:15',
}

const HOUR_TIMES: Record<number, string> = {
  1: '8:00–9:00',
  2: '9:00–10:00',
  3: '10:00–11:00',
  4: '11:00–12:00',
  5: '12:00–13:00',
  6: '13:00–14:00',
  7: '14:00–15:00',
}

function shortName(name: string): string {
  const parts = name.split(' ')
  if (parts.length === 1) return name
  return `${parts.slice(0, -1).join(' ')} ${parts.at(-1)![0]}.`
}

function SlotRow({ s }: { s: RenderedSlot }) {
  if (s.kind === 'padel') {
    return (
      <div className="bg-orange-50 border border-dashed border-orange-300 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="min-w-[5rem] text-xs text-stone-500 leading-tight">
            <div>{s.hour}ª ora</div>
            <div className="text-[10px] text-stone-400">{HOUR_TIMES[s.hour]}</div>
          </div>
          <span className="bg-orange-600 text-white px-2 py-0.5 rounded text-sm font-bold">🎾 PADEL</span>
          <span className="text-sm text-orange-900 line-through opacity-70">{s.class?.code}</span>
        </div>
        <div className="text-xs text-orange-900 italic mt-1 ml-12">Classe al centro padel · no lezione</div>
      </div>
    )
  }

  if (s.kind === 'assembly' || s.kind === 'strike' || s.kind === 'custom') {
    const configs: Record<string, { borderCls: string; bgCls: string; badgeBg: string; label: string }> = {
      assembly: { borderCls: 'border-yellow-300', bgCls: 'bg-yellow-50', badgeBg: '#B45309', label: 'Assemblea' },
      strike:   { borderCls: 'border-gray-300',   bgCls: 'bg-gray-50',   badgeBg: '#374151', label: 'Sciopero'  },
      custom:   { borderCls: 'border-stone-300',  bgCls: 'bg-stone-50',  badgeBg: '#6B7280', label: 'Variazione' },
    }
    const cfg = configs[s.kind]
    return (
      <div className={`border border-dashed ${cfg.borderCls} ${cfg.bgCls} rounded-lg px-3 py-2`}>
        <div className="flex items-center gap-2">
          <div className="min-w-[5rem] text-xs text-stone-500 leading-tight">
            <div>{s.hour}ª ora</div>
            <div className="text-[10px] text-stone-400">{HOUR_TIMES[s.hour]}</div>
          </div>
          <span className="text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide" style={{ background: cfg.badgeBg }}>
            {cfg.label}
          </span>
          {s.class && (
            <span className="text-sm line-through opacity-40" style={{ color: s.class.color }}>{s.class.code}</span>
          )}
        </div>
        {s.note && <div className="text-xs text-stone-600 italic mt-1 ml-20">{s.note}</div>}
      </div>
    )
  }

  if (s.kind === 'cover') {
    return (
      <div className="bg-blue-50 border border-dashed border-blue-300 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="min-w-[5rem] text-xs text-stone-500 leading-tight">
            <div>{s.hour}ª ora</div>
            <div className="text-[10px] text-stone-400">{HOUR_TIMES[s.hour]}</div>
          </div>
          <span className="bg-blue-700 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">Supplenza</span>
          {s.class && (
            <span
              className="text-white px-2 py-0.5 rounded text-sm font-bold"
              style={{ background: s.class.color }}
            >
              {s.class.code}
            </span>
          )}
        </div>
        {s.note && <div className="text-xs text-blue-900 italic mt-1 ml-20">{s.note}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="min-w-[5rem] text-xs text-stone-500 leading-tight">
          <div>{s.hour}ª ora</div>
          <div className="text-[10px] text-stone-400">{HOUR_TIMES[s.hour]}</div>
        </div>
        <span
          className="text-white px-2 py-0.5 rounded text-sm font-bold"
          style={{ background: s.class?.color }}
        >
          {s.class?.code}
        </span>
        {s.class?.room && (
          <span className="text-xs text-stone-400 font-mono">
            {s.class.floor?.[0]}·{s.class.room}
          </span>
        )}
      </div>
      {s.coteachers.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-20">
          {s.coteachers.map((c, i) => (
            <span key={i} className="bg-stone-100 border border-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded">
              {shortName(c.name)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function DayCard({ day }: { day: RenderedDay }) {
  const date = parseISO(day.date)
  const dayNum = format(date, 'd')
  const weekdayName = format(date, 'EEEE', { locale: it })
  const monthName = format(date, 'MMMM', { locale: it })
  const isWeekend = day.weekday >= 5

  const bgClass = day.isHoliday
    ? 'bg-red-50 border-red-200'
    : isWeekend
    ? 'bg-stone-50 opacity-70 border-stone-200'
    : 'bg-white border-stone-200'

  return (
    <article className={`rounded-2xl border ${bgClass} overflow-hidden`}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
        <div className="text-3xl font-extrabold tabular-nums">{dayNum}</div>
        <div>
          <div className="font-bold capitalize">{weekdayName}</div>
          <div className="text-xs uppercase tracking-wide text-stone-400">{monthName}</div>
        </div>
      </header>

      <div className="px-4 py-3 space-y-2">
        {day.isHoliday && (
          <div className="flex items-center gap-2 text-red-800 font-semibold">
            🚫 <span>{day.holidayLabel}</span>
          </div>
        )}

        {!day.isHoliday && !isWeekend && day.slots.length > 0 && (
          <>
            <div className="text-xs font-bold uppercase tracking-wide text-stone-500">☀️ Mattina</div>
            {day.slots.some(s => s.kind === 'padel') && (
              <div className="inline-block bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                🎾 Progetto &quot;Racchette in Classe&quot;
              </div>
            )}
            <div className="space-y-1.5">
              {day.slots.map((s, idx) => (
                <div key={s.hour}>
                  <SlotRow s={s} />
                  {BREAKS[s.hour] && idx < day.slots.length - 1 && (
                    <div className="flex items-center gap-2 my-1.5">
                      <div className="flex-1 border-t border-dashed border-stone-200" />
                      <span className="text-[10px] text-stone-400 font-medium">☕ {BREAKS[s.hour]}</span>
                      <div className="flex-1 border-t border-dashed border-stone-200" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {day.meetings.length > 0 && (
          <>
            <div className="text-xs font-bold uppercase tracking-wide text-stone-500 mt-3">🕒 Pomeriggio</div>
            {day.meetings.map(m => (
              <div
                key={m.id}
                className="rounded border-l-4 bg-stone-50 px-3 py-2"
                style={{ borderColor: EVENT_COLORS[m.kind] ?? '#888' }}
              >
                <div className="font-bold text-sm" style={{ color: EVENT_COLORS[m.kind] ?? '#444' }}>
                  {m.title}
                </div>
                {(m.startTime || m.endTime) && (
                  <div className="text-xs text-stone-500">
                    {m.startTime && `dalle ${m.startTime.slice(0, 5)}`}
                    {m.endTime && ` alle ${m.endTime.slice(0, 5)}`}
                  </div>
                )}
                {m.notes && (
                  <div className="text-xs text-amber-800 bg-amber-50 mt-1 px-2 py-1 rounded">⚠️ {m.notes}</div>
                )}
              </div>
            ))}
          </>
        )}

        {isWeekend && !day.isHoliday && (
          <div className="text-sm italic text-stone-400">Riposo</div>
        )}
      </div>
    </article>
  )
}
