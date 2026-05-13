import { db } from '@/db'
import { classes, weeklySlots, coteachers, holidays, dayOverrides, meetings } from '@/db/schema'
import { renderDays } from '@/lib/calendar-engine'
import Link from 'next/link'
import { format, parseISO, addDays } from 'date-fns'
import { it } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

const HOUR_TIMES: Record<number, string> = {
  1: '8:00', 2: '9:00', 3: '10:00', 4: '11:00',
  5: '12:00', 6: '13:00', 7: '14:00',
}

const EVENT_COLORS: Record<string, string> = {
  collegio: '#1A237E', dipartimento: '#004D40', cdc: '#E65100',
  colloqui: '#37474F', scrutini: '#4A148C',
}

const EVENT_TEXT_CLS: Record<string, string> = {
  collegio: 'text-indigo-900 dark:text-indigo-300',
  dipartimento: 'text-teal-900 dark:text-teal-300',
  cdc: 'text-orange-700 dark:text-orange-400',
  colloqui: 'text-slate-700 dark:text-slate-300',
  scrutini: 'text-purple-900 dark:text-purple-300',
}

export default async function OggiPage() {
  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date())

  const [classesData, weeklyData, coteachersData, holidaysData, overridesData, meetingsData] =
    await Promise.all([
      db.select().from(classes),
      db.select().from(weeklySlots),
      db.select().from(coteachers),
      db.select().from(holidays),
      db.select().from(dayOverrides),
      db.select().from(meetings),
    ])

  const rangeEnd = addDays(parseISO(todayIso), 6)
  const rangeEndIso = format(rangeEnd, 'yyyy-MM-dd')

  const input = {
    classes: classesData.map(c => ({ id: c.id, code: c.code, color: c.color, room: c.room, floor: c.floor })),
    weeklySlots: weeklyData.map(w => ({ weekday: w.weekday, hour: w.hour, classId: w.classId! })),
    coteachers: coteachersData.map(c => ({
      classId: c.classId!, weekday: c.weekday!, hour: c.hour!, teacherName: c.teacherName, role: c.role,
    })),
    holidays: holidaysData.map(h => ({ date: h.date, label: h.label })),
    dayOverrides: overridesData.map(o => ({
      date: o.date, hour: o.hour, kind: o.kind, classId: o.classId, note: o.note,
    })),
    meetings: meetingsData.map(m => ({
      id: m.id, date: m.date, startTime: m.startTime, endTime: m.endTime, kind: m.kind, title: m.title, notes: m.notes,
    })),
    lessonEndDate: '2026-06-08',
  }

  const days = renderDays(input, todayIso, rangeEndIso)
  const today = days.find(d => d.date === todayIso)

  const SUPPLENZA_END = '2026-06-11'
  const allDays = renderDays(input, todayIso, SUPPLENZA_END)
  const lessonDays = allDays.filter(d => d.date >= todayIso && d.slots.some(s => s.kind === 'lesson')).length
  const scrutiniDays = allDays.filter(d => d.date >= todayIso && d.meetings.some(m => m.kind === 'scrutini')).length

  const nextLesson = !today?.isHoliday && today?.weekday !== undefined && today.weekday <= 4
    ? today?.slots.filter(s => s.kind === 'lesson')[0]
    : null

  const upcomingWithEvents = days
    .filter(d => d.date > todayIso && d.weekday <= 4 && !d.isHoliday && (d.slots.length > 0 || d.meetings.length > 0))
    .slice(0, 5)

  const todayLabel = today ? format(parseISO(today.date), 'EEEE d MMMM', { locale: it }) : ''

  return (
    <main className="max-w-xl mx-auto pb-24">
      <header className="sticky top-0 bg-stone-900 text-white z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Oggi</h1>
            <p className="text-xs opacity-70 capitalize">{todayLabel}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/circolari" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Circolari
            </Link>
            <Link href="/" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Calendario
            </Link>
          </div>
        </div>
        <div className="bg-amber-500 text-stone-900 px-4 py-2 flex items-center justify-center gap-4 text-sm font-semibold">
          <span className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold tabular-nums leading-none">{lessonDays}</span>
            <span className="text-xs uppercase tracking-wide">gg lezioni</span>
          </span>
          <span className="opacity-40">·</span>
          <span className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold tabular-nums leading-none">{scrutiniDays}</span>
            <span className="text-xs uppercase tracking-wide">gg scrutini</span>
          </span>
          <span className="text-xs opacity-70">alla fine supplenza</span>
        </div>
      </header>

      <div className="p-3 space-y-4">
        {/* Today card */}
        {today && (
          <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden">
            <div className="bg-stone-900 dark:bg-stone-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-wide">
              📅 Oggi
            </div>
            <div className="px-4 py-3 space-y-3">
              {today.isHoliday && (
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold">
                  🚫 {today.holidayLabel}
                </div>
              )}

              {!today.isHoliday && today.weekday !== undefined && today.weekday <= 4 && today.slots.length === 0 && today.meetings.length === 0 && (
                <p className="text-sm text-stone-400 dark:text-stone-500 italic">Nessun impegno registrato.</p>
              )}

              {today.weekday !== undefined && today.weekday > 4 && (
                <p className="text-sm text-stone-400 dark:text-stone-500 italic">Weekend — riposo.</p>
              )}

              {!today.isHoliday && today.weekday !== undefined && today.weekday <= 4 && today.slots.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">☀️ Lezioni</div>
                  <div className="space-y-1.5">
                    {today.slots.map(s => (
                      <div key={s.hour} className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 dark:text-stone-500 min-w-[4rem]">
                          {HOUR_TIMES[s.hour]}
                        </span>
                        {s.kind === 'padel' ? (
                          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">🎾 PADEL</span>
                        ) : (
                          <span
                            className="text-white text-sm font-bold px-2 py-0.5 rounded"
                            style={{ background: s.class?.color }}
                          >
                            {s.class?.code}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {today.meetings.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">🕒 Pomeriggio</div>
                  <div className="space-y-1.5">
                    {today.meetings.map(m => (
                      <div
                        key={m.id}
                        className="rounded border-l-4 bg-stone-50 dark:bg-stone-800 px-3 py-2"
                        style={{ borderColor: EVENT_COLORS[m.kind] ?? '#888' }}
                      >
                        <div className={`font-bold text-sm ${EVENT_TEXT_CLS[m.kind] ?? 'text-stone-700 dark:text-stone-200'}`}>
                          {m.title}
                        </div>
                        {m.startTime && (
                          <div className="text-xs text-stone-500 dark:text-stone-400">dalle {m.startTime.slice(0, 5)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Next few days */}
        {upcomingWithEvents.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2 px-1">
              Prossimi giorni
            </h2>
            <div className="space-y-2">
              {upcomingWithEvents.map(d => (
                <div
                  key={d.date}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5"
                >
                  <div className="text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 capitalize">
                    {format(parseISO(d.date), 'EEEE d MMM', { locale: it })}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.slots.map(s => (
                      <span
                        key={s.hour}
                        className={s.kind === 'padel' ? 'bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded' : 'text-white text-xs font-bold px-2 py-0.5 rounded'}
                        style={s.kind !== 'padel' ? { background: s.class?.color } : undefined}
                      >
                        {s.kind === 'padel' ? '🎾' : s.class?.code}
                      </span>
                    ))}
                    {d.meetings.map(m => (
                      <span
                        key={m.id}
                        className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800"
                        style={{ color: EVENT_COLORS[m.kind] ?? '#555' }}
                      >
                        {m.title}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-2 pt-2">
          <a
            href="/api/export/ics"
            className="flex-1 text-center bg-stone-900 dark:bg-stone-700 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-stone-700 dark:hover:bg-stone-600 transition"
          >
            📅 Esporta ICS
          </a>
          <Link
            href="/circolari"
            className="flex-1 text-center bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-sm font-semibold py-2.5 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition border border-stone-200 dark:border-stone-700"
          >
            📢 Circolari
          </Link>
        </div>
      </div>
    </main>
  )
}
