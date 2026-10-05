import 'dotenv/config'
import { db } from '../db'
import { classes, meetings } from '../db/schema'

/**
 * Impegni pomeridiani di ottobre 2026:
 * - Collegio docenti del 5/10 (15:00–16:15)
 * - Consigli di classe delle mie classi dal calendario d'istituto
 *   (Calendario-Consigli-di-Classe-Ottobre-2026.pdf)
 */
async function main() {
  const byCode = Object.fromEntries((await db.select().from(classes)).map(c => [c.code, c.id]))

  const cdc = [
    { date: '2026-10-13', startTime: '14:00', endTime: '15:00', code: '1MAN' },
    { date: '2026-10-13', startTime: '15:00', endTime: '16:00', code: '2MAN' },
    { date: '2026-10-13', startTime: '16:00', endTime: '17:00', code: '3MAN' },
    { date: '2026-10-13', startTime: '17:00', endTime: '18:00', code: '4MAN' },
    { date: '2026-10-14', startTime: '16:00', endTime: '17:00', code: '2LSA' },
    { date: '2026-10-22', startTime: '15:00', endTime: '16:00', code: '4IAN' },
  ]
  for (const c of cdc) if (!byCode[c.code]) throw new Error(`Classe ${c.code} non trovata`)

  const rows = [
    { date: '2026-10-05', startTime: '15:00', endTime: '16:15', kind: 'collegio', title: 'Collegio docenti', classId: null },
    ...cdc.map(c => ({
      date: c.date, startTime: c.startTime, endTime: c.endTime,
      kind: 'cdc', title: `Consiglio di classe ${c.code}`, classId: byCode[c.code],
    })),
  ]
  await db.insert(meetings).values(rows)
  console.log(`✅ Inseriti ${rows.length} impegni`)
  process.exit(0)
}
main()
