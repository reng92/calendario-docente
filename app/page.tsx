import { db } from '@/db'
import { classes, weeklySlots, coteachers, holidays, dayOverrides, meetings } from '@/db/schema'
import { renderDays } from '@/lib/calendar-engine'
import { CalendarView } from '@/components/CalendarView'
import { PushSubscribeButton } from '@/components/PushSubscribeButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [classesData, weeklyData, coteachersData, holidaysData, overridesData, meetingsData] =
    await Promise.all([
      db.select().from(classes),
      db.select().from(weeklySlots),
      db.select().from(coteachers),
      db.select().from(holidays),
      db.select().from(dayOverrides),
      db.select().from(meetings),
    ])

  const days = renderDays(
    {
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
    },
    '2026-04-20',
    '2026-06-30'
  )

  const SUPPLENZA_END = '2026-06-11'
  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date())
  const remaining = days.filter(d => d.date >= todayIso && d.date <= SUPPLENZA_END)
  const lessonDays = remaining.filter(d => d.slots.some(s => s.kind === 'lesson')).length
  const scrutiniDays = remaining.filter(d => d.meetings.some(m => m.kind === 'scrutini')).length

  return (
    <main className="pb-24">
      <header className="sticky top-0 bg-stone-900 text-white z-10">
        <div className="max-w-xl mx-auto md:max-w-none md:px-6 lg:px-8 py-3 px-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold">Calendario impegni</h1>
            <p className="text-xs opacity-70">IIS Einstein-Bachelet · Via Pasquale II, Roma</p>
          </div>
          <div className="flex gap-1.5 shrink-0 items-center">
            <ThemeToggle />
            <PushSubscribeButton compact />
            <Link href="/oggi" className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold px-2 py-1.5 rounded-full">
              Oggi
            </Link>
            <Link href="/docenti" className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold px-2 py-1.5 rounded-full">
              Docenti
            </Link>
            <Link href="/admin" className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold px-2 py-1.5 rounded-full">
              ✏️
            </Link>
          </div>
        </div>
        <div className="bg-amber-500 text-stone-900">
          <div className="max-w-xl mx-auto md:max-w-none md:px-6 lg:px-8 px-4 py-2 flex items-center justify-center gap-4 text-sm font-semibold">
            <span className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold tabular-nums leading-none">{lessonDays}</span>
              <span className="text-xs uppercase tracking-wide">giorni di lezioni</span>
            </span>
            <span className="opacity-40">·</span>
            <span className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold tabular-nums leading-none">{scrutiniDays}</span>
              <span className="text-xs uppercase tracking-wide">giorni di scrutini</span>
            </span>
            <span className="text-xs opacity-70 hidden sm:inline">alla fine supplenza (11 giu)</span>
          </div>
          <div className="sm:hidden text-center text-[10px] opacity-70 pb-1.5 -mt-1">
            alla fine supplenza · 11 giugno
          </div>
        </div>
      </header>
      <div className="max-w-xl mx-auto md:max-w-none md:px-2 lg:px-4">
        <CalendarView days={days} />
      </div>
    </main>
  )
}
