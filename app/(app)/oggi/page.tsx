import { db } from '@/db'
import { classes, weeklySlots, coteachers, holidays, dayOverrides, meetings } from '@/db/schema'
import { renderDays } from '@/lib/calendar-engine'
import { AppHeader } from '@/components/AppHeader'
import { TodayView } from '@/components/TodayView'
import { getRomeNow } from '@/components/now'
import { format, parseISO, addDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { LESSONS_END } from '@/lib/schedule'

export const dynamic = 'force-dynamic'

export default async function OggiPage() {
  const now = getRomeNow()
  const todayIso = now.date

  const [classesData, weeklyData, coteachersData, holidaysData, overridesData, meetingsData] =
    await Promise.all([
      db.select().from(classes),
      db.select().from(weeklySlots),
      db.select().from(coteachers),
      db.select().from(holidays),
      db.select().from(dayOverrides),
      db.select().from(meetings),
    ])

  const rangeEndIso = format(addDays(parseISO(todayIso), 14), 'yyyy-MM-dd')

  const days = renderDays(
    {
      classes: classesData.map(c => ({ id: c.id, code: c.code, color: c.color, subject: c.subject, room: c.room, floor: c.floor })),
      weeklySlots: weeklyData.map(w => ({
        weekday: w.weekday, hour: w.hour, classId: w.classId!, subject: w.subject, room: w.room,
        validFrom: w.validFrom, validTo: w.validTo,
      })),
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
    todayIso,
    rangeEndIso,
  )

  const today = days.find(d => d.date === todayIso) ?? null
  const nextDay = days.find(d => d.date > todayIso && d.weekday <= 4 && (d.slots.length > 0 || d.meetings.length > 0 || d.isHoliday)) ?? null
  const todayLabel = format(parseISO(todayIso), 'EEEE d MMMM', { locale: it })

  return (
    <main className="mx-auto max-w-xl">
      <AppHeader title="Oggi" subtitle={todayLabel} />
      <TodayView today={today} nextDay={nextDay} initialNow={now} />
    </main>
  )
}
