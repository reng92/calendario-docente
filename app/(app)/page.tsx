import { db } from '@/db'
import { classes, weeklySlots, coteachers, holidays, dayOverrides, meetings } from '@/db/schema'
import { renderDays } from '@/lib/calendar-engine'
import { CalendarView } from '@/components/CalendarView'
import { AppHeader } from '@/components/AppHeader'
import { SCHOOL_SHORT, LESSONS_END, CALENDAR_FROM, CALENDAR_TO } from '@/lib/schedule'

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
      classes: classesData.map(c => ({ id: c.id, code: c.code, color: c.color, subject: c.subject, room: c.room, floor: c.floor })),
      weeklySlots: weeklyData.map(w => ({ weekday: w.weekday, hour: w.hour, classId: w.classId!, subject: w.subject, room: w.room })),
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
      lessonEndDate: LESSONS_END,
    },
    CALENDAR_FROM,
    CALENDAR_TO
  )

  return (
    <main>
      <AppHeader title="Settimana" subtitle={SCHOOL_SHORT} wide />
      <div className="mx-auto max-w-xl md:max-w-6xl">
        <CalendarView days={days} />
      </div>
    </main>
  )
}
