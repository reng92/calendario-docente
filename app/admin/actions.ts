'use server'

import { db } from '@/db'
import { meetings, dayOverrides, holidays } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createMeeting(data: {
  date: string; startTime?: string; endTime?: string;
  kind: string; title: string; notes?: string;
}) {
  await db.insert(meetings).values({
    date: data.date,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    kind: data.kind,
    title: data.title,
    notes: data.notes || null,
  })
  revalidatePath('/')
  revalidatePath('/admin/meetings')
}

export async function deleteMeeting(id: string) {
  await db.delete(meetings).where(eq(meetings.id, id))
  revalidatePath('/')
  revalidatePath('/admin/meetings')
}

export async function createOverride(data: {
  date: string; hour?: number; kind: string; note?: string;
}) {
  await db.insert(dayOverrides).values({
    date: data.date,
    hour: data.hour ?? null,
    kind: data.kind,
    note: data.note || null,
  })
  revalidatePath('/')
  revalidatePath('/admin/overrides')
}

export async function deleteOverride(id: string) {
  await db.delete(dayOverrides).where(eq(dayOverrides.id, id))
  revalidatePath('/')
  revalidatePath('/admin/overrides')
}

export async function createHoliday(date: string, label: string) {
  await db.insert(holidays).values({ date, label })
  revalidatePath('/')
  revalidatePath('/admin/holidays')
}

export async function deleteHoliday(id: string) {
  await db.delete(holidays).where(eq(holidays.id, id))
  revalidatePath('/')
  revalidatePath('/admin/holidays')
}
