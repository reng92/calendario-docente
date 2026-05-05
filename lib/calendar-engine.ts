import { format, eachDayOfInterval, parseISO } from 'date-fns'

export type ClassInfo = { id: string; code: string; color: string; room: string | null; floor: string | null }

export type CalendarInput = {
  classes: ClassInfo[]
  weeklySlots: Array<{ weekday: number; hour: number; classId: string }>
  coteachers: Array<{ classId: string; weekday: number; hour: number; teacherName: string; role: string | null }>
  holidays: Array<{ date: string; label: string }>
  dayOverrides: Array<{ date: string; hour: number | null; kind: string; classId: string | null; note: string | null }>
  meetings: Array<{ id: string; date: string; startTime: string | null; endTime: string | null; kind: string; title: string; notes: string | null }>
  lessonEndDate?: string
}

export type RenderedSlot = {
  hour: number
  class: ClassInfo | null
  kind: 'lesson' | 'padel' | 'assembly' | 'strike' | 'cover' | 'custom'
  note: string | null
  coteachers: Array<{ name: string; role: string | null }>
}

export type RenderedDay = {
  date: string
  weekday: number
  isHoliday: boolean
  holidayLabel: string | null
  slots: RenderedSlot[]
  meetings: Array<{ id: string; startTime: string | null; endTime: string | null; kind: string; title: string; notes: string | null }>
}

export function renderDays(input: CalendarInput, from: string, to: string): RenderedDay[] {
  const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) })
  const classById = new Map(input.classes.map(c => [c.id, c]))
  const holidayByDate = new Map(input.holidays.map(h => [h.date, h.label]))
  const overridesByDate = groupBy(input.dayOverrides, o => o.date)
  const meetingsByDate = groupBy(input.meetings, m => m.date)

  return days.map(d => {
    const iso = format(d, 'yyyy-MM-dd')
    const jsDay = d.getDay()
    const weekday = jsDay === 0 ? 6 : jsDay - 1
    const isHoliday = holidayByDate.has(iso)
    const holidayLabel = holidayByDate.get(iso) ?? null

    const slots: RenderedSlot[] = []
    if (!isHoliday && weekday <= 4 && (!input.lessonEndDate || iso <= input.lessonEndDate)) {
      const slotsToday = input.weeklySlots.filter(s => s.weekday === weekday)
      for (const s of slotsToday) {
        const klass = classById.get(s.classId) ?? null
        const override = (overridesByDate.get(iso) ?? []).find(
          o => o.hour === s.hour && o.classId === s.classId
        )
        const coteachersForSlot = input.coteachers
          .filter(c => c.classId === s.classId && c.weekday === weekday && c.hour === s.hour)
          .map(c => ({ name: c.teacherName, role: c.role }))

        slots.push({
          hour: s.hour,
          class: klass,
          kind: override ? (override.kind as RenderedSlot['kind']) : 'lesson',
          note: override?.note ?? null,
          coteachers: override ? [] : coteachersForSlot,
        })
      }

      // Extra override slots (e.g. cover for a class/hour not in regular schedule)
      for (const override of overridesByDate.get(iso) ?? []) {
        if (override.classId == null || override.hour == null) continue
        const alreadyHandled = input.weeklySlots.some(
          s => s.weekday === weekday && s.hour === override.hour && s.classId === override.classId
        )
        if (alreadyHandled) continue
        const klass = classById.get(override.classId) ?? null
        slots.push({
          hour: override.hour,
          class: klass,
          kind: override.kind as RenderedSlot['kind'],
          note: override.note ?? null,
          coteachers: [],
        })
      }
    }

    return {
      date: iso,
      weekday,
      isHoliday,
      holidayLabel,
      slots: slots.sort((a, b) => a.hour - b.hour),
      meetings: (meetingsByDate.get(iso) ?? []).sort((a, b) =>
        (a.startTime ?? '').localeCompare(b.startTime ?? '')
      ),
    }
  })
}

function groupBy<T, K>(arr: T[], keyFn: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>()
  for (const item of arr) {
    const k = keyFn(item)
    const list = m.get(k) ?? []
    list.push(item)
    m.set(k, list)
  }
  return m
}
