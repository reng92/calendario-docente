import { NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/auth/cron'
import { db } from '@/db'
import { classes, weeklySlots, coteachers, dayOverrides, holidays, notificationLog } from '@/db/schema'
import { sendPushToAll } from '@/lib/push'
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'
import { eq, and } from 'drizzle-orm'

const TZ = 'Europe/Rome'

const HOUR_TIMES: Record<number, string> = {
  1: '08:00', 2: '09:00', 3: '10:00', 4: '11:00',
  5: '12:00', 6: '13:00', 7: '14:00',
}

export async function POST(req: Request) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  const nowUtc = new Date()
  const nowRome = toZonedTime(nowUtc, TZ)
  const todayStr = format(nowRome, 'yyyy-MM-dd')
  const jsDay = nowRome.getDay()
  const weekday = jsDay === 0 ? 6 : jsDay - 1

  if (weekday > 4) return NextResponse.json({ ok: true, skipped: 'weekend' })

  const todayHolidays = await db
    .select()
    .from(holidays)
    .where(eq(holidays.date, todayStr))

  if (todayHolidays.length > 0) {
    return NextResponse.json({ ok: true, skipped: 'holiday' })
  }

  const slots = await db
    .select({ hour: weeklySlots.hour, classId: weeklySlots.classId })
    .from(weeklySlots)
    .where(eq(weeklySlots.weekday, weekday))

  const overrides = await db
    .select()
    .from(dayOverrides)
    .where(eq(dayOverrides.date, todayStr))

  for (const slot of slots) {
    if (!slot.classId) continue
    const startTimeStr = HOUR_TIMES[slot.hour]
    if (!startTimeStr) continue

    const [h, m] = startTimeStr.split(':').map(Number)
    const lessonStart = new Date(nowRome)
    lessonStart.setHours(h, m, 0, 0)

    const diffMin = (lessonStart.getTime() - nowRome.getTime()) / 60000
    if (diffMin < 9 || diffMin > 11) continue

    const override = overrides.find(
      (o) => o.hour === slot.hour && o.classId === slot.classId
    )
    if (override?.kind === 'padel') continue

    const dedupeKey = `lesson:${slot.classId}:${todayStr}:${slot.hour}`
    try {
      await db.insert(notificationLog).values({ kind: 'lesson', dedupeKey })
    } catch {
      continue
    }

    const [klass] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, slot.classId))

    if (!klass) continue

    const cotList = await db
      .select({ teacherName: coteachers.teacherName })
      .from(coteachers)
      .where(
        and(
          eq(coteachers.classId, slot.classId),
          eq(coteachers.weekday, weekday),
          eq(coteachers.hour, slot.hour),
        )
      )

    const cotStr = cotList.length > 0
      ? ` · con ${cotList.map(c => c.teacherName.split(' ').pop()).join(', ')}`
      : ''
    const roomStr = klass.room ? ` · ${klass.room}` : ''

    await sendPushToAll({
      title: `${slot.hour}ª ora — ${klass.code}`,
      body: `${klass.subject ?? 'Lezione'} tra 10 min${roomStr}${cotStr}`,
      url: '/',
      tag: `lesson-${slot.classId}-${todayStr}-${slot.hour}`,
    })
  }

  return NextResponse.json({ ok: true })
}
