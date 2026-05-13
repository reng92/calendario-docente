import { NextResponse } from 'next/server'
import { db } from '@/db'
import { meetings, holidays } from '@/db/schema'
import { asc } from 'drizzle-orm'

function escIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsDate(date: string, time?: string | null): string {
  const d = date.replace(/-/g, '')
  if (!time) return `${d}`
  const t = time.replace(/:/g, '').slice(0, 6)
  return `${d}T${t}`
}

function uid(prefix: string, id: string): string {
  return `${prefix}-${id}@calendario-docente`
}

export async function GET() {
  const [meetingsData, holidaysData] = await Promise.all([
    db.select().from(meetings).orderBy(asc(meetings.date)),
    db.select().from(holidays).orderBy(asc(holidays.date)),
  ])

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendario Docente//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Calendario Docente IIS Einstein-Bachelet',
    'X-WR-TIMEZONE:Europe/Rome',
  ]

  for (const m of meetingsData) {
    const hasTime = !!m.startTime
    const dtstart = hasTime
      ? `DTSTART;TZID=Europe/Rome:${icsDate(m.date, m.startTime)}`
      : `DTSTART;VALUE=DATE:${icsDate(m.date)}`
    const dtend = hasTime && m.endTime
      ? `DTEND;TZID=Europe/Rome:${icsDate(m.date, m.endTime)}`
      : hasTime
      ? `DTEND;TZID=Europe/Rome:${icsDate(m.date, m.startTime)}`
      : `DTEND;VALUE=DATE:${icsDate(m.date)}`

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid('meeting', m.id)}`,
      dtstart,
      dtend,
      `SUMMARY:${escIcs(m.title)}`,
      ...(m.notes ? [`DESCRIPTION:${escIcs(m.notes)}`] : []),
      ...(m.location ? [`LOCATION:${escIcs(m.location)}`] : []),
      'END:VEVENT',
    )
  }

  for (const h of holidaysData) {
    const d = h.date.replace(/-/g, '')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid('holiday', h.id)}`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${d}`,
      `SUMMARY:${escIcs(h.label)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  const body = lines.join('\r\n') + '\r\n'

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calendario-docente.ics"',
      'Cache-Control': 'no-store',
    },
  })
}
