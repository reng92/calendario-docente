# Calendario docente — Build plan

Sei Claude Code. Il tuo compito è costruire un'app Next.js 15 che replica e estende un calendario docente esistente, deployandola su Vercel con database Neon Postgres. L'utente (Renato, docente B015 all'IIS Einstein-Bachelet di Roma) esegue questo file dal terminale di VS Code nella sua repo GitHub vuota chiamata `calendario-docente`.

## Stack obbligatorio

- **Next.js 15** (App Router, Turbopack, TypeScript, Tailwind)
- **Neon Postgres** (l'utente ha già l'account)
- **Drizzle ORM** (schema + migrations + studio)
- **date-fns** per le date
- **Vercel** per il deploy
- **pnpm** come package manager

NON usare: Supabase, Prisma, tRPC, Clerk, NextAuth, shadcn (non necessario per MVP).

## Cosa costruiamo

App mobile-first che mostra il calendario giornaliero di un docente con:
- Lezioni mattutine per classe (7 classi, colori univoci)
- Compresenze (altri docenti in aula)
- Impegni pomeridiani (collegi, consigli di classe, scrutini, colloqui, dipartimento)
- Festività e sospensioni
- Progetto "Racchette in Classe" (PADEL) che sospende lezioni in date specifiche
- **CRUD completo** per tutti gli impegni (l'utente deve poter aggiornare quando escono nuove comunicazioni dalla scuola)

## Protezione app

Password singola via cookie, gestita da middleware. L'utente sceglierà la password e la metterà in `APP_PASSWORD` nelle env var.

---

## SEQUENZA DI LAVORO

Segui questi step in ordine. Al termine di ogni fase, fai commit con messaggio convenzionale (`feat:`, `chore:`, ecc.). **Chiedi all'utente SOLO le cose marcate 🙋.**

---

### FASE 1 — Verifica ambiente

```bash
node -v    # deve essere ≥ 20
pnpm -v    # se manca: npm install -g pnpm
git -v
```

Se pnpm manca, installalo. Se Node è < 20, ferma tutto e avvisa l'utente.

Verifica di essere dentro una repo Git già clonata (ci sarà `.git/`). La directory dovrebbe essere vuota o quasi (solo `README.md` eventualmente). Se non è una repo Git, ferma tutto.

---

### FASE 2 — Inizializza Next.js

Dentro la cartella corrente (`.`):

```bash
pnpm create next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint --use-pnpm --yes
```

Se il comando si lamenta che la directory non è vuota, sposta temporaneamente `README.md` fuori, fai il create, rimettilo dentro.

Poi installa le dipendenze aggiuntive:

```bash
pnpm add drizzle-orm postgres date-fns
pnpm add -D drizzle-kit @types/node tsx dotenv
```

---

### FASE 3 — Chiedi all'utente DATABASE_URL e APP_PASSWORD 🙋

**Devi chiedere all'utente DUE cose e aspettare la risposta prima di procedere:**

1. La connection string di Neon. Istruzioni da dare all'utente:
   > Vai su console.neon.tech → crea un progetto chiamato `calendario-docente` in region `AWS Europe (Frankfurt)` con Postgres 16 → nella dashboard copia la "Connection string" che comincia con `postgresql://neondb_owner:...@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require` → incollala qui.

2. La password che userà per accedere all'app. Suggerisci di usarne una forte ma memorizzabile (es. combinazione di 3 parole + numero). Se l'utente non vuole sceglierla ora, genera tu una password random di 20 caratteri e mostragliela con nota "segnatela, ti servirà per accedere".

Poi crea `.env.local` nella root con:

```env
DATABASE_URL="<la stringa Neon>"
APP_PASSWORD="<la password>"
```

Verifica che `.env.local` sia in `.gitignore` (Next lo mette di default; se manca, aggiungilo).

---

### FASE 4 — Struttura cartelle e file di config

Crea queste cartelle: `db/`, `db/migrations/`, `lib/`, `scripts/`, `components/`.

Crea `drizzle.config.ts` nella root:

```ts
import type { Config } from 'drizzle-kit'
import 'dotenv/config'

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
```

Modifica `package.json` aggiungendo agli `scripts`:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"db:seed": "tsx scripts/seed.ts"
```

---

### FASE 5 — Schema Drizzle (`db/schema.ts`)

```ts
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
```

---

### FASE 6 — Connessione DB (`db/index.ts`)

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
```

---

### FASE 7 — Genera migration e applica al DB Neon

```bash
pnpm db:generate
pnpm db:migrate
```

Se dà errore di connessione: verifica che DATABASE_URL sia corretto. Se lo schema è già stato applicato una volta e dà conflitti, usa `drizzle-kit push` come fallback.

Alla fine, chiedi all'utente di verificare su console.neon.tech → Tables che ci siano 6 tabelle: `classes`, `weekly_slots`, `day_overrides`, `meetings`, `coteachers`, `holidays`.

---

### FASE 8 — Seed completo (`scripts/seed.ts`)

```ts
import 'dotenv/config'
import { db } from '../db'
import { classes, weeklySlots, coteachers, holidays, dayOverrides, meetings } from '../db/schema'
import { sql } from 'drizzle-orm'

const VALID_FROM = '2026-01-07'

async function seed() {
  console.log('🧹 Pulizia tabelle...')
  await db.execute(sql`TRUNCATE meetings, day_overrides, holidays, coteachers, weekly_slots, classes RESTART IDENTITY CASCADE`)

  console.log('📚 Classi...')
  const classData = [
    { code: '5CT',  color: '#B5651D', subject: 'TPSEE' },
    { code: '5ET',  color: '#C0392B', subject: 'TPSEE' },
    { code: '4AT',  color: '#27AE60', subject: 'TPSEE' },
    { code: '3CT',  color: '#7D3C98', subject: 'Elettrotecnica' },
    { code: '3GTB', color: '#16A085', subject: 'Elettrotecnica' },
    { code: '4CT',  color: '#2874A6', subject: 'TPSEE' },
    { code: '4DT',  color: '#AD1457', subject: 'TPSEE' },
  ]
  const insertedClasses = await db.insert(classes).values(classData).returning()
  const byCode = Object.fromEntries(insertedClasses.map(c => [c.code, c.id]))

  console.log('📅 Orario settimanale...')
  const schedule: Array<[number, number, string]> = [
    [0, 5, '4CT'], [0, 6, '4CT'],
    [1, 2, '5ET'], [1, 3, '5ET'], [1, 4, '3CT'], [1, 5, '3CT'],
    [2, 1, '5CT'], [2, 2, '5CT'], [2, 4, '3GTB'], [2, 5, '3GTB'],
    [3, 5, '4DT'], [3, 6, '4DT'], [3, 7, '4AT'],
    [4, 2, '4AT'], [4, 3, '4AT'], [4, 4, '3GTB'], [4, 5, '5ET'], [4, 6, '5CT'],
  ]
  await db.insert(weeklySlots).values(
    schedule.map(([wd, h, code]) => ({
      weekday: wd, hour: h, classId: byCode[code], validFrom: VALID_FROM,
    }))
  )

  console.log('👥 Compresenze...')
  const coteacherData = [
    { code: '4CT', wd: 0, h: 5, name: 'Caputo Stefano',      role: 'altro' },
    { code: '4CT', wd: 0, h: 5, name: 'Imperatore Stefania', role: 'sostegno' },
    { code: '4CT', wd: 0, h: 6, name: 'Caputo Stefano',      role: 'altro' },
    { code: '5ET', wd: 1, h: 2, name: 'Tara Giada',          role: 'altro' },
    { code: '5ET', wd: 1, h: 3, name: 'Tara Giada',          role: 'altro' },
    { code: '5ET', wd: 1, h: 3, name: 'Divenuto Rossella',   role: 'sostegno' },
    { code: '3CT', wd: 1, h: 4, name: 'Caputo Stefano',      role: 'altro' },
    { code: '3CT', wd: 1, h: 4, name: 'Bevacqua Caterina',   role: 'sostegno' },
    { code: '3CT', wd: 1, h: 5, name: 'Caputo Stefano',      role: 'altro' },
    { code: '3CT', wd: 1, h: 5, name: 'Muto Elisabetta',     role: 'sostegno' },
    { code: '5CT', wd: 2, h: 1, name: 'Caputo Stefano',      role: 'altro' },
    { code: '5CT', wd: 2, h: 2, name: 'Caputo Stefano',      role: 'altro' },
    { code: '3GTB',wd: 2, h: 4, name: 'Calzetti Angelo',     role: 'altro' },
    { code: '3GTB',wd: 2, h: 5, name: 'Calzetti Angelo',     role: 'altro' },
    { code: '4DT', wd: 3, h: 5, name: 'Puolo Adriana',       role: 'altro' },
    { code: '4DT', wd: 3, h: 6, name: 'Puolo Adriana',       role: 'altro' },
    { code: '4AT', wd: 3, h: 7, name: 'De Blasio Giuliano',  role: 'altro' },
    { code: '4AT', wd: 4, h: 2, name: 'De Blasio Giuliano',  role: 'altro' },
    { code: '4AT', wd: 4, h: 3, name: 'De Blasio Giuliano',  role: 'altro' },
    { code: '3GTB',wd: 4, h: 4, name: 'Calzetti Angelo',     role: 'altro' },
    { code: '5ET', wd: 4, h: 5, name: 'Tara Giada',          role: 'altro' },
    { code: '5ET', wd: 4, h: 5, name: 'Divenuto Rossella',   role: 'sostegno' },
    { code: '5CT', wd: 4, h: 6, name: 'Caputo Stefano',      role: 'altro' },
  ]
  await db.insert(coteachers).values(
    coteacherData.map(c => ({
      classId: byCode[c.code], weekday: c.wd, hour: c.h, teacherName: c.name, role: c.role,
    }))
  )

  console.log('🚫 Festività e sospensioni...')
  await db.insert(holidays).values([
    { date: '2025-11-01', label: 'Festa di Ognissanti' },
    { date: '2025-12-08', label: 'Immacolata Concezione' },
    { date: '2025-12-22', label: 'Recupero anticipazione a.s.' },
    { date: '2025-12-23', label: 'Vacanze di Natale' },
    { date: '2025-12-24', label: 'Vacanze di Natale' },
    { date: '2025-12-25', label: 'Natale' },
    { date: '2025-12-26', label: 'Santo Stefano' },
    { date: '2025-12-27', label: 'Vacanze di Natale' },
    { date: '2025-12-29', label: 'Vacanze di Natale' },
    { date: '2025-12-30', label: 'Vacanze di Natale' },
    { date: '2025-12-31', label: 'Vacanze di Natale' },
    { date: '2026-01-02', label: 'Vacanze di Natale' },
    { date: '2026-01-03', label: 'Vacanze di Natale' },
    { date: '2026-01-05', label: 'Vacanze di Natale' },
    { date: '2026-01-06', label: 'Epifania' },
    { date: '2026-04-02', label: 'Vacanze di Pasqua' },
    { date: '2026-04-03', label: 'Vacanze di Pasqua' },
    { date: '2026-04-06', label: 'Vacanze di Pasqua' },
    { date: '2026-04-07', label: 'Vacanze di Pasqua' },
    { date: '2026-04-25', label: 'Festa della Liberazione' },
    { date: '2026-05-01', label: 'Festa del Lavoro' },
    { date: '2026-06-01', label: 'Recupero anticipazione a.s.' },
    { date: '2026-06-02', label: 'Festa della Repubblica' },
    { date: '2026-06-29', label: 'Festa del Santo Patrono' },
  ])

  console.log('🎾 Progetto Racchette in Classe (PADEL)...')
  const padelDates = [
    '2026-04-27', '2026-05-04', '2026-05-11', '2026-05-18',
    '2026-04-30', '2026-05-07', '2026-05-14', '2026-05-21',
    '2026-05-08', '2026-05-15', '2026-05-22', '2026-05-29',
  ]
  const padelOverrides: Array<{ date: string, hour: number, classId: string }> = []
  for (const d of padelDates) {
    const dayOfWeek = new Date(d + 'T00:00:00Z').getUTCDay()
    if (dayOfWeek === 1) {
      padelOverrides.push({ date: d, hour: 5, classId: byCode['4CT'] })
      padelOverrides.push({ date: d, hour: 6, classId: byCode['4CT'] })
    } else if (dayOfWeek === 4) {
      padelOverrides.push({ date: d, hour: 5, classId: byCode['4DT'] })
      padelOverrides.push({ date: d, hour: 6, classId: byCode['4DT'] })
    } else if (dayOfWeek === 5) {
      padelOverrides.push({ date: d, hour: 2, classId: byCode['4AT'] })
      padelOverrides.push({ date: d, hour: 3, classId: byCode['4AT'] })
    }
  }
  await db.insert(dayOverrides).values(
    padelOverrides.map(p => ({
      date: p.date, hour: p.hour, kind: 'padel', classId: p.classId,
      note: 'Progetto "Racchette in Classe"',
    }))
  )

  console.log('🏫 Impegni pomeridiani...')
  await db.insert(meetings).values([
    { date: '2026-05-05', kind: 'dipartimento', title: 'Riunione dipartimentale',
      startTime: '15:00:00', endTime: '17:00:00',
      notes: 'Il piano indica "Lunedì 5 maggio", ma cade di martedì — verificare con la scuola' },
    { date: '2026-05-06', kind: 'colloqui', title: 'Colloqui generali scuola-famiglia',
      startTime: '15:00:00', endTime: '17:00:00' },
    { date: '2026-05-07', kind: 'colloqui', title: 'Colloqui generali scuola-famiglia',
      startTime: '15:00:00', endTime: '17:00:00' },
    { date: '2026-05-11', kind: 'cdc', title: 'Consigli di classe',
      startTime: '15:00:00', notes: 'Adozione libri di testo + andamento' },
    { date: '2026-05-12', kind: 'cdc', title: 'Consigli di classe', startTime: '15:00:00' },
    { date: '2026-05-13', kind: 'cdc', title: 'Consigli di classe', startTime: '15:00:00' },
    { date: '2026-05-14', kind: 'cdc', title: 'Consigli di classe', startTime: '15:00:00' },
    { date: '2026-05-15', kind: 'cdc', title: 'Consigli di classe', startTime: '15:00:00' },
    { date: '2026-05-18', kind: 'collegio', title: 'Collegio docenti',
      startTime: '15:00:00', endTime: '17:00:00' },
    { date: '2026-06-08', kind: 'scrutini', title: 'Scrutini II quadrimestre', notes: 'Inizio' },
    { date: '2026-06-09', kind: 'scrutini', title: 'Scrutini II quadrimestre' },
    { date: '2026-06-10', kind: 'scrutini', title: 'Scrutini II quadrimestre' },
    { date: '2026-06-11', kind: 'scrutini', title: 'Scrutini II quadrimestre' },
    { date: '2026-06-12', kind: 'scrutini', title: 'Scrutini II quadrimestre', notes: 'Fine' },
  ])

  console.log('✅ Seed completato!')
  process.exit(0)
}

seed().catch(e => {
  console.error('❌ Seed fallito:', e)
  process.exit(1)
})
```

Esegui `pnpm db:seed`. Se funziona, fai vedere all'utente 2-3 righe del log di successo.

---

### FASE 9 — Middleware + pagina login

Crea `middleware.ts` nella root:

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get('app-auth')?.value
  const isAuth = cookie === process.env.APP_PASSWORD
  const isLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isLoginApi = req.nextUrl.pathname.startsWith('/api/login')

  if (!isAuth && !isLoginPage && !isLoginApi) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
}
```

Crea `app/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      window.location.href = '/'
    } else {
      setError('Password errata')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-100 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold">Calendario docente</h1>
        <p className="text-sm text-stone-500">Inserisci la password per accedere.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base"
          placeholder="Password"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-stone-900 text-white py-2 font-semibold disabled:opacity-50"
        >
          {loading ? 'Verifica...' : 'Accedi'}
        </button>
      </form>
    </main>
  )
}
```

Crea `app/api/login/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { password } = await req.json()
  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const cookieStore = await cookies()
  cookieStore.set('app-auth', password, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return NextResponse.json({ ok: true })
}
```

---

### FASE 10 — Calendar engine (`lib/calendar-engine.ts`)

```ts
import { format, eachDayOfInterval, parseISO } from 'date-fns'

export type ClassInfo = { id: string; code: string; color: string }

export type CalendarInput = {
  classes: ClassInfo[]
  weeklySlots: Array<{ weekday: number; hour: number; classId: string }>
  coteachers: Array<{ classId: string; weekday: number; hour: number; teacherName: string; role: string | null }>
  holidays: Array<{ date: string; label: string }>
  dayOverrides: Array<{ date: string; hour: number | null; kind: string; classId: string | null; note: string | null }>
  meetings: Array<{ id: string; date: string; startTime: string | null; kind: string; title: string; notes: string | null }>
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
  meetings: Array<{ id: string; startTime: string | null; kind: string; title: string; notes: string | null }>
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
    if (!isHoliday && weekday <= 4) {
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
          kind: override ? (override.kind as any) : 'lesson',
          note: override?.note ?? null,
          coteachers: override ? [] : coteachersForSlot,
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
```

---

### FASE 11 — Componente DayCard (`components/DayCard.tsx`)

```tsx
import type { RenderedDay } from '@/lib/calendar-engine'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

const EVENT_COLORS: Record<string, string> = {
  collegio: '#1A237E',
  dipartimento: '#004D40',
  cdc: '#E65100',
  colloqui: '#37474F',
  scrutini: '#4A148C',
}

function shortName(name: string): string {
  const parts = name.split(' ')
  if (parts.length === 1) return name
  return `${parts.slice(0, -1).join(' ')} ${parts.at(-1)![0]}.`
}

export function DayCard({ day }: { day: RenderedDay }) {
  const date = parseISO(day.date)
  const dayNum = format(date, 'd')
  const weekdayName = format(date, 'EEEE', { locale: it })
  const monthName = format(date, 'MMMM', { locale: it })
  const isWeekend = day.weekday >= 5

  const bgClass = day.isHoliday
    ? 'bg-red-50 border-red-200'
    : isWeekend
    ? 'bg-stone-50 opacity-70 border-stone-200'
    : 'bg-white border-stone-200'

  return (
    <article className={`rounded-2xl border ${bgClass} overflow-hidden`}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
        <div className="text-3xl font-extrabold tabular-nums">{dayNum}</div>
        <div>
          <div className="font-bold capitalize">{weekdayName}</div>
          <div className="text-xs uppercase tracking-wide text-stone-400">{monthName}</div>
        </div>
      </header>

      <div className="px-4 py-3 space-y-2">
        {day.isHoliday && (
          <div className="flex items-center gap-2 text-red-800 font-semibold">
            🚫 <span>{day.holidayLabel}</span>
          </div>
        )}

        {!day.isHoliday && !isWeekend && day.slots.length > 0 && (
          <>
            <div className="text-xs font-bold uppercase tracking-wide text-stone-500">☀️ Mattina</div>
            {day.slots.some(s => s.kind === 'padel') && (
              <div className="inline-block bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                🎾 Progetto "Racchette in Classe"
              </div>
            )}
            <div className="space-y-1.5">
              {day.slots.map(s =>
                s.kind === 'padel' ? (
                  <div key={s.hour} className="bg-orange-50 border border-dashed border-orange-300 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500 min-w-[3rem]">{s.hour}ª</span>
                      <span className="bg-orange-600 text-white px-2 py-0.5 rounded text-sm font-bold">🎾 PADEL</span>
                      <span className="text-sm text-orange-900 line-through opacity-70">{s.class?.code}</span>
                    </div>
                    <div className="text-xs text-orange-900 italic mt-1 ml-12">Classe al centro padel · no lezione</div>
                  </div>
                ) : (
                  <div key={s.hour} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500 min-w-[3rem]">{s.hour}ª</span>
                      <span
                        className="text-white px-2 py-0.5 rounded text-sm font-bold"
                        style={{ background: s.class?.color }}
                      >
                        {s.class?.code}
                      </span>
                    </div>
                    {s.coteachers.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-14">
                        {s.coteachers.map((c, i) => (
                          <span key={i} className="bg-stone-100 border border-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded">
                            {shortName(c.name)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </>
        )}

        {day.meetings.length > 0 && (
          <>
            <div className="text-xs font-bold uppercase tracking-wide text-stone-500 mt-3">🕒 Pomeriggio</div>
            {day.meetings.map(m => (
              <div
                key={m.id}
                className="rounded border-l-4 bg-stone-50 px-3 py-2"
                style={{ borderColor: EVENT_COLORS[m.kind] ?? '#888' }}
              >
                <div className="font-bold text-sm" style={{ color: EVENT_COLORS[m.kind] ?? '#444' }}>
                  {m.title}
                </div>
                {m.startTime && (
                  <div className="text-xs text-stone-500">dalle {m.startTime.slice(0, 5)}</div>
                )}
                {m.notes && (
                  <div className="text-xs text-amber-800 bg-amber-50 mt-1 px-2 py-1 rounded">⚠️ {m.notes}</div>
                )}
              </div>
            ))}
          </>
        )}

        {isWeekend && !day.isHoliday && (
          <div className="text-sm italic text-stone-400">Riposo</div>
        )}
      </div>
    </article>
  )
}
```

---

### FASE 12 — Pagina principale (`app/page.tsx`) e layout

Sovrascrivi `app/page.tsx` con:

```tsx
import { db } from '@/db'
import { classes, weeklySlots, coteachers, holidays, dayOverrides, meetings } from '@/db/schema'
import { renderDays } from '@/lib/calendar-engine'
import { DayCard } from '@/components/DayCard'
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
      classes: classesData.map(c => ({ id: c.id, code: c.code, color: c.color })),
      weeklySlots: weeklyData.map(w => ({ weekday: w.weekday, hour: w.hour, classId: w.classId! })),
      coteachers: coteachersData.map(c => ({
        classId: c.classId!, weekday: c.weekday!, hour: c.hour!, teacherName: c.teacherName, role: c.role,
      })),
      holidays: holidaysData.map(h => ({ date: h.date, label: h.label })),
      dayOverrides: overridesData.map(o => ({
        date: o.date, hour: o.hour, kind: o.kind, classId: o.classId, note: o.note,
      })),
      meetings: meetingsData.map(m => ({
        id: m.id, date: m.date, startTime: m.startTime, kind: m.kind, title: m.title, notes: m.notes,
      })),
    },
    '2026-04-20',
    '2026-06-12'
  )

  return (
    <main className="max-w-xl mx-auto pb-24">
      <header className="sticky top-0 bg-stone-900 text-white p-4 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Calendario impegni</h1>
          <p className="text-xs opacity-70">IIS Einstein-Bachelet · Via Pasquale II, Roma</p>
        </div>
        <Link href="/admin" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          Modifica
        </Link>
      </header>
      <div className="p-3 space-y-2">
        {days.map(d => <DayCard key={d.date} day={d} />)}
      </div>
    </main>
  )
}
```

Modifica `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Calendario docente',
  description: 'Calendario impegni IIS Einstein-Bachelet',
  manifest: '/manifest.json',
  themeColor: '#1c1917',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-stone-100 antialiased">{children}</body>
    </html>
  )
}
```

---

### FASE 13 — CRUD admin

Questa è la parte importante: l'utente deve poter aggiornare quando escono circolari nuove (orari CdC, scrutini, ecc.).

**Hub admin** — `app/admin/page.tsx`:

```tsx
import Link from 'next/link'

export default function AdminHome() {
  const sections = [
    { href: '/admin/meetings', label: 'Impegni pomeridiani', desc: 'Collegi, CdC, scrutini, colloqui' },
    { href: '/admin/overrides', label: 'Modifiche giornaliere', desc: 'Assemblee, scioperi, progetti, supplenze' },
    { href: '/admin/holidays', label: 'Festività', desc: 'Sospensioni delle lezioni' },
  ]
  return (
    <main className="max-w-xl mx-auto pb-24">
      <header className="sticky top-0 bg-stone-900 text-white p-4 z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold">Modifica dati</h1>
        <Link href="/" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          ← Calendario
        </Link>
      </header>
      <div className="p-3 space-y-2">
        {sections.map(s => (
          <Link key={s.href} href={s.href} className="block bg-white border border-stone-200 rounded-2xl px-4 py-3 hover:border-stone-400 transition">
            <div className="font-bold">{s.label}</div>
            <div className="text-xs text-stone-500">{s.desc}</div>
          </Link>
        ))}
        <p className="text-xs text-stone-400 px-1 pt-2">Per modificare orario settimanale, classi e compresenze usa <code>pnpm db:studio</code> in locale.</p>
      </div>
    </main>
  )
}
```

**Server actions** — `app/admin/actions.ts`:

```ts
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
```

**Pagina meetings** — `app/admin/meetings/page.tsx`:

```tsx
import { db } from '@/db'
import { meetings } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { MeetingForm } from './MeetingForm'
import { DeleteButton } from '../DeleteButton'
import { deleteMeeting } from '../actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const KIND_LABELS: Record<string, string> = {
  collegio: 'Collegio docenti',
  cdc: 'Consiglio di classe',
  dipartimento: 'Dipartimento',
  colloqui: 'Colloqui',
  scrutini: 'Scrutini',
}

export default async function MeetingsPage() {
  const rows = await db.select().from(meetings).orderBy(desc(meetings.date))

  return (
    <main className="max-w-xl mx-auto pb-24">
      <header className="sticky top-0 bg-stone-900 text-white p-4 z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold">Impegni pomeridiani</h1>
        <Link href="/admin" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          ← Admin
        </Link>
      </header>
      <div className="p-3 space-y-4">
        <section className="bg-white border border-stone-200 rounded-2xl p-4">
          <h2 className="font-bold mb-3">Nuovo impegno</h2>
          <MeetingForm />
        </section>
        <section className="space-y-2">
          {rows.map(m => (
            <div key={m.id} className="bg-white border border-stone-200 rounded-2xl p-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-stone-500">{m.date} {m.startTime && `· ${m.startTime.slice(0, 5)}`}</div>
                <div className="font-bold">{m.title}</div>
                <div className="text-xs text-stone-500">{KIND_LABELS[m.kind] ?? m.kind}</div>
                {m.notes && <div className="text-xs text-amber-700 mt-1">⚠️ {m.notes}</div>}
              </div>
              <DeleteButton id={m.id} action={deleteMeeting} />
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
```

**Form meeting** — `app/admin/meetings/MeetingForm.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'
import { createMeeting } from '../actions'

export function MeetingForm() {
  const [pending, setPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function onSubmit(formData: FormData) {
    setPending(true)
    await createMeeting({
      date: formData.get('date') as string,
      startTime: (formData.get('startTime') as string) || undefined,
      endTime: (formData.get('endTime') as string) || undefined,
      kind: formData.get('kind') as string,
      title: formData.get('title') as string,
      notes: (formData.get('notes') as string) || undefined,
    })
    setPending(false)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input name="date" type="date" required className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <select name="kind" required className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
          <option value="">Tipo...</option>
          <option value="collegio">Collegio docenti</option>
          <option value="cdc">Consiglio di classe</option>
          <option value="dipartimento">Dipartimento</option>
          <option value="colloqui">Colloqui</option>
          <option value="scrutini">Scrutini</option>
        </select>
      </div>
      <input name="title" required placeholder="Titolo" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <input name="startTime" type="time" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <input name="endTime" type="time" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </div>
      <textarea name="notes" placeholder="Note (opzionale)" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" rows={2} />
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-stone-900 text-white py-2 font-semibold disabled:opacity-50">
        {pending ? 'Salvataggio...' : 'Aggiungi'}
      </button>
    </form>
  )
}
```

**Bottone delete generico** — `app/admin/DeleteButton.tsx`:

```tsx
'use client'

export function DeleteButton({ id, action }: { id: string; action: (id: string) => Promise<void> }) {
  async function handle() {
    if (!confirm('Eliminare?')) return
    await action(id)
  }
  return (
    <button onClick={handle} className="text-red-600 text-xs font-semibold hover:underline">
      Elimina
    </button>
  )
}
```

**Pagine overrides e holidays**: replica lo stesso pattern della pagina meetings. Per `overrides` i campi del form sono: `date` (required), `hour` (number 1-7 optional), `kind` (select: padel/assembly/strike/cover/custom), `note`. Per `holidays` solo `date` + `label`.

---

### FASE 14 — PWA minimale

Crea `public/manifest.json`:

```json
{
  "name": "Calendario docente",
  "short_name": "Calendario",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f4f1ec",
  "theme_color": "#1c1917",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Avvisa che il manifest funziona anche senza icone (si useranno default); l'utente può aggiungerle dopo in `/public`.

---

### FASE 15 — Test locale

```bash
pnpm dev
```

Dai all'utente queste istruzioni di verifica:

1. Apri http://localhost:3000 → ti porta a `/login`
2. Inserisci la password → ti porta al calendario con tutti i dati
3. Clicca "Modifica" in alto → entra nell'admin
4. "Impegni pomeridiani" → prova a creare un impegno fittizio → torna al calendario e verifica che appaia → torna nell'admin ed eliminalo

Se qualcosa non funziona, fermati e chiedi quale errore appare (console browser + terminale).

---

### FASE 16 — Commit + push

```bash
git add -A
git commit -m "feat: mvp calendario docente with auth, crud, seed"
git push
```

---

### FASE 17 — Deploy Vercel 🙋

**Chiedi all'utente** di:

1. Andare su vercel.com → Add New Project
2. Importare la repo GitHub `calendario-docente`
3. Framework: Next.js (rilevato in automatico)
4. Environment Variables — aggiungere DUE var:
   - `DATABASE_URL` = stessa stringa di `.env.local`
   - `APP_PASSWORD` = stessa password di `.env.local`
5. Deploy → aspettare build verde
6. Aprire l'URL di produzione, login, verificare

Se il build Vercel fallisce, chiedi l'errore esatto e risolvi.

---

### FASE 18 — PWA sul telefono

Istruzioni finali da dare all'utente:

- **iPhone Safari**: apri URL di produzione → login → Condividi ⎋ → "Aggiungi a Home"
- **Android Chrome**: apri URL → login → menu ⋮ → "Installa app" / "Aggiungi a schermata Home"

---

## REGOLE PER TE (Claude Code)

1. **Non chiedere permesso per ogni comando**: vai avanti. Chiedi solo per le cose marcate 🙋.
2. **Fai commit frequenti**: uno per fase importante (dopo Drizzle setup, dopo seed, dopo CRUD, dopo deploy).
3. **Se un test fallisce o un comando dà errore**: fermati, mostra l'errore, proponi la fix, chiedi conferma.
4. **Gestisci automaticamente problemi TypeScript**: se vedi `any` impliciti o tipi mancanti, risolvi. Non chiedere.
5. **NON inventare dati**: tutti i dati di seed sono in questo file. Se qualcosa manca, chiedi.
6. **Quando finisci**, mostra un riepilogo di cosa è stato fatto, cosa funziona, e i 3 prossimi step suggeriti (aggiungere icone PWA, estendere CRUD a weekly/coteachers/classes, dominio custom Vercel).

Pronto. Parti dalla Fase 1.