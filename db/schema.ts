import { pgTable, uuid, text, smallint, date, time, boolean, timestamp, bigserial } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').notNull().unique(),
  color: text('color').notNull(),
  subject: text('subject'),
  room: text('room'),
  floor: text('floor'),
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

// Push notification subscriptions (one per device)
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  deviceLabel: text('device_label'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow(),
})

// Circular/news sources to monitor
export const sources = pgTable('sources', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  kind: text('kind').notNull(), // 'rss' | 'html'
  selector: text('selector'),
  keywords: text('keywords').array(),
  active: boolean('active').notNull().default(true),
})

// Deduplication: what we've already seen/notified
export const circolariSeen = pgTable('circolari_seen', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sourceKey: text('source_key').notNull(),
  externalId: text('external_id').notNull(),
  titolo: text('titolo').notNull(),
  url: text('url').notNull(),
  pubblicataIl: timestamp('pubblicata_il', { withTimezone: true }),
  notificataIl: timestamp('notificata_il', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Deduplication for lesson notifications
export const notificationLog = pgTable('notification_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  kind: text('kind').notNull(), // 'lesson' | 'circolare'
  dedupeKey: text('dedupe_key').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
})
