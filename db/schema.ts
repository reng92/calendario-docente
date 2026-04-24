import { pgTable, uuid, text, smallint, date, time, boolean, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').notNull().unique(),
  color: text('color').notNull(),
  subject: text('subject'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const weeklySlots = pgTable('weekly_slots', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  weekday: smallint('weekday').notNull(),
  hour: smallint('hour').notNull(),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  room: text('room'),
  validFrom: date('valid_from').notNull(),
  validTo: date('valid_to'),
})

export const dayOverrides = pgTable('day_overrides', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  date: date('date').notNull(),
  hour: smallint('hour'),
  kind: text('kind').notNull(),
  classId: uuid('class_id').references(() => classes.id),
  note: text('note'),
})

export const meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  date: date('date').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  classId: uuid('class_id').references(() => classes.id),
  location: text('location'),
  mandatory: boolean('mandatory').default(true),
  attended: boolean('attended'),
  notes: text('notes'),
})

export const coteachers = pgTable('coteachers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  weekday: smallint('weekday'),
  hour: smallint('hour'),
  teacherName: text('teacher_name').notNull(),
  role: text('role'),
})

export const holidays = pgTable('holidays', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  date: date('date').notNull(),
  label: text('label').notNull(),
})
