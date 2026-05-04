import { db } from '@/db'
import { classes, weeklySlots, coteachers, holidays, dayOverrides, meetings } from '@/db/schema'
import { renderDays } from '@/lib/calendar-engine'
import { CalendarView } from '@/components/CalendarView'
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
    },
    '2026-04-20',
    '2026-06-12'
  )

  return (
    <main className="pb-24">
      <header className="sticky top-0 bg-stone-900 text-white z-10">
        <div className="max-w-xl mx-auto md:max-w-none md:px-6 lg:px-8 py-3 px-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Calendario impegni</h1>
            <p className="text-xs opacity-70">IIS Einstein-Bachelet · Via Pasquale II, Roma</p>
          </div>
          <div className="flex gap-2">
            <Link href="/docenti" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Docenti
            </Link>
            <Link href="/admin" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Modifica
            </Link>
          </div>
        </div>
      </header>
      <div className="max-w-xl mx-auto md:max-w-none md:px-2 lg:px-4">
        <CalendarView days={days} />
      </div>
    </main>
  )
}
