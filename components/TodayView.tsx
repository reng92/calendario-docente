'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import type { RenderedDay, RenderedSlot } from '@/lib/calendar-engine'
import { BREAKS, HOUR_EFFECTIVE_START, HOUR_END, HOUR_START, timeToMin } from '@/lib/schedule'
import { LessonRow, BreakRow, ClassChip } from '@/components/LessonRow'
import { MeetingRow } from '@/components/MeetingRow'
import { getRomeNow, slotState, breakAfter, formatMinutes, type RomeNow } from '@/components/now'
import { isDisposizione } from '@/components/tokens'
import { cn } from '@/components/utils'

type Props = {
  today: RenderedDay | null
  nextDay: RenderedDay | null
  initialNow: RomeNow
}

type NowState =
  | { kind: 'holiday'; label: string }
  | { kind: 'weekend' }
  | { kind: 'none' }
  | { kind: 'before'; slot: RenderedSlot; startsIn: number }
  | { kind: 'during'; slot: RenderedSlot; endsIn: number }
  | { kind: 'break'; next: RenderedSlot | null; endsIn: number; until: string }
  | { kind: 'after' }

function strip(t: string | undefined): string {
  return (t ?? '').replace(/^0/, '')
}

function computeState(day: RenderedDay | null, now: RomeNow): NowState {
  if (!day) return { kind: 'none' }
  if (day.isHoliday) return { kind: 'holiday', label: day.holidayLabel ?? 'Festività' }
  if (day.weekday > 4) return { kind: 'weekend' }
  const slots = [...day.slots].sort((a, b) => a.hour - b.hour)
  if (slots.length === 0) return { kind: 'none' }

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    const start = timeToMin(HOUR_EFFECTIVE_START[s.hour] ?? HOUR_START[s.hour] ?? '00:00')
    const end = timeToMin(HOUR_END[s.hour] ?? '00:00')
    if (now.minutes < start) {
      // siamo prima di questo slot: intervallo in corso?
      const prev = slots[i - 1]
      const brk = prev ? breakAfter(prev.hour) : null
      if (brk && now.minutes >= brk.start && now.minutes < brk.end) {
        return { kind: 'break', next: s, endsIn: brk.end - now.minutes, until: strip(BREAKS[prev.hour]?.split('–')[1]) }
      }
      return { kind: 'before', slot: s, startsIn: start - now.minutes }
    }
    if (now.minutes < end) {
      // dentro lo slot; l'intervallo può "mangiare" gli ultimi minuti dell'ora precedente
      const brk = breakAfter(s.hour)
      if (brk && now.minutes >= brk.start && now.minutes < brk.end) {
        return { kind: 'break', next: slots[i + 1] ?? null, endsIn: brk.end - now.minutes, until: strip(BREAKS[s.hour]?.split('–')[1]) }
      }
      return { kind: 'during', slot: s, endsIn: end - now.minutes }
    }
  }
  return { kind: 'after' }
}

function Hero({ state, day }: { state: NowState; day: RenderedDay | null }) {
  const base = 'rounded-card border px-4 py-4'

  if (state.kind === 'holiday') {
    return (
      <section className={cn(base, 'border-line bg-surface')}>
        <p className="text-caption text-danger">Niente lezioni</p>
        <p className="mt-1 text-title text-ink">{state.label}</p>
      </section>
    )
  }
  if (state.kind === 'weekend') {
    return (
      <section className={cn(base, 'border-line bg-surface')}>
        <p className="text-caption text-muted">Fine settimana</p>
        <p className="mt-1 text-title text-ink">Nessuna lezione oggi</p>
      </section>
    )
  }
  if (state.kind === 'none') {
    return (
      <section className={cn(base, 'border-line bg-surface')}>
        <p className="text-caption text-muted">Oggi</p>
        <p className="mt-1 text-title text-ink">Nessuna lezione in orario</p>
      </section>
    )
  }
  if (state.kind === 'after') {
    const nextMeeting = day?.meetings.find(m => m.startTime) ?? null
    return (
      <section className={cn(base, 'border-line bg-surface')}>
        <p className="text-caption text-ok">Lezioni finite</p>
        <p className="mt-1 text-title text-ink">
          {nextMeeting ? `Nel pomeriggio: ${nextMeeting.title}` : 'A domani'}
        </p>
        {nextMeeting?.startTime && (
          <p className="mt-1 text-small text-muted tabular">dalle {nextMeeting.startTime.slice(0, 5)}</p>
        )}
      </section>
    )
  }
  if (state.kind === 'break') {
    const n = state.next
    return (
      <section className={cn(base, 'border-accent/30 bg-accent-soft')}>
        <p className="text-caption text-accent">Intervallo · fino alle {state.until}</p>
        <p className="mt-1 text-display text-ink">{formatMinutes(state.endsIn)}</p>
        {n && (
          <p className="mt-2 flex items-center gap-2 text-small text-muted">
            <span>Poi</span>
            <ClassChip code={n.class?.code ?? '—'} color={n.class?.color} muted={isDisposizione(n.class?.code)} />
            <span className="font-semibold text-ink">{n.subject}</span>
            {n.room && !isDisposizione(n.class?.code) && <span className="tabular">· {n.room}</span>}
          </p>
        )}
      </section>
    )
  }

  const s = state.slot
  const disp = isDisposizione(s.class?.code)
  const range = `${strip(HOUR_EFFECTIVE_START[s.hour])}–${strip(HOUR_END[s.hour])}`
  const label = state.kind === 'during' ? 'Adesso' : 'Prossima'
  const timing = state.kind === 'during'
    ? `Finisce tra ${formatMinutes(state.endsIn)}`
    : state.startsIn <= 90 ? `Inizia tra ${formatMinutes(state.startsIn)}` : `Inizia alle ${strip(HOUR_EFFECTIVE_START[s.hour])}`
  const cot = s.coteachers.map(c => c.name).join(', ')

  return (
    <section className={cn(base, 'border-accent/30 bg-accent-soft')}>
      <p className="text-caption text-accent tabular">{label} · {s.hour}ª ora · {range}</p>
      <p className={cn('mt-1 leading-none', disp ? 'text-title text-muted' : 'text-display text-ink')}>
        {disp ? 'Propria classe' : s.room ?? '—'}
      </p>
      <p className="mt-2 flex items-center gap-2 text-body">
        <ClassChip code={s.class?.code ?? '—'} color={s.class?.color} muted={disp} className="h-7 text-small" />
        <span className="font-semibold text-ink">{disp ? '' : s.subject}</span>
      </p>
      {cot && <p className="mt-0.5 text-small text-muted">con {cot}</p>}
      <p className="mt-3 text-small font-semibold text-accent">{timing}</p>
    </section>
  )
}

export function TodayView({ today, nextDay, initialNow }: Props) {
  const [now, setNow] = useState<RomeNow>(initialNow)
  useEffect(() => {
    const tick = () => setNow(getRomeNow())
    tick()
    const id = setInterval(tick, 30_000)
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const state = computeState(today, now)
  const slots = today ? [...today.slots].sort((a, b) => a.hour - b.hour) : []
  const nextHour = slots.find(s => slotState(s.hour, today!.date, now) === 'future')?.hour
  const isMeetingPast = (m: { startTime: string | null; endTime: string | null }) => {
    const end = m.endTime ?? m.startTime
    return end ? now.minutes >= timeToMin(end) : false
  }

  return (
    <div className="space-y-4 p-4">
      <Hero state={state} day={today} />

      {today && !today.isHoliday && (slots.length > 0 || today.meetings.length > 0) && (
        <section className="rounded-card border border-line bg-surface px-2 py-2">
          {slots.length > 0 && (
            <>
              <p className="px-2 pt-1 pb-1 text-caption text-muted">Mattina</p>
              {slots.map((s, idx) => (
                <div key={`${s.hour}-${s.class?.id ?? 'x'}`}>
                  <LessonRow slot={s} date={today.date} state={slotState(s.hour, today.date, now, nextHour)} />
                  {BREAKS[s.hour] && idx < slots.length - 1 && <BreakRow label={BREAKS[s.hour]} />}
                </div>
              ))}
            </>
          )}
          {today.meetings.length > 0 && (
            <div className={cn(slots.length > 0 && 'mt-1 border-t border-line pt-1')}>
              <p className="px-2 pt-1 pb-1 text-caption text-muted">Pomeriggio</p>
              {today.meetings.map(m => <MeetingRow key={m.id} m={m} past={isMeetingPast(m)} />)}
            </div>
          )}
        </section>
      )}

      {nextDay && (
        <section>
          <div className="flex items-baseline justify-between px-1 pb-2">
            <h2 className="text-heading text-ink">
              {nextDay.date === addDaysIso(now.date, 1) ? 'Domani' : 'Prossimo giorno di lezione'}
            </h2>
            <span className="text-small capitalize text-muted">
              {format(parseISO(nextDay.date), 'EEEE d MMMM', { locale: it })}
            </span>
          </div>
          <div className="rounded-card border border-line bg-surface px-2 py-1">
            {nextDay.isHoliday ? (
              <p className="px-2 py-2 text-small text-danger">{nextDay.holidayLabel}</p>
            ) : (
              <>
                {[...nextDay.slots].sort((a, b) => a.hour - b.hour).map(s => (
                  <LessonRow key={`${s.hour}-${s.class?.id ?? 'x'}`} slot={s} date={nextDay.date} compact />
                ))}
                {nextDay.meetings.map(m => <MeetingRow key={m.id} m={m} compact />)}
              </>
            )}
          </div>
          <Link href="/" className="mt-2 flex min-h-11 items-center justify-center text-small font-semibold text-accent">
            Vedi tutta la settimana
          </Link>
        </section>
      )}
    </div>
  )
}

function addDaysIso(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return format(d, 'yyyy-MM-dd')
}
