'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Schedule = { [day: string]: { [hour: string]: string } }
type Teacher = { name: string; schedule: Schedule }

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven']
const ALL_HOURS = [1, 2, 3, 4, 5, 6, 7]
const HOUR_LABELS: Record<number, string> = {
  1: '8–9', 2: '9–10', 3: '10–11', 4: '11–12',
  5: '12–13', 6: '13–14', 7: '14–15',
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const usedHours = new Set<number>()
  for (let d = 0; d < 5; d++) {
    for (const h of Object.keys(teacher.schedule[d] ?? {})) usedHours.add(Number(h))
  }
  const hours = ALL_HOURS.filter(h => usedHours.has(h))
  if (hours.length === 0) return null

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50">
        <span className="font-bold text-stone-800 text-sm">{teacher.name}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[340px]">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left text-stone-400 font-normal w-14">Ora</th>
              {DAYS.map(d => (
                <th key={d} className="px-1 py-1.5 text-center text-stone-600 font-bold">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((h, idx) => (
              <tr key={h} className={idx % 2 === 0 ? '' : 'bg-stone-50/60'}>
                <td className="px-2 py-1.5 text-stone-400 whitespace-nowrap">
                  {h}ª <span className="text-[9px] text-stone-300">{HOUR_LABELS[h]}</span>
                </td>
                {[0, 1, 2, 3, 4].map(d => {
                  const cls = teacher.schedule[String(d)]?.[String(h)]
                  return (
                    <td key={d} className="px-1 py-1.5 text-center">
                      {cls && (
                        <span className="inline-block bg-stone-700 text-white font-semibold px-1.5 py-0.5 rounded text-[11px] leading-none">
                          {cls}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DocentiPage() {
  const [query, setQuery] = useState('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/docenti.json')
      .then(r => r.json())
      .then((data: Teacher[]) => { setTeachers(data); setLoading(false) })
  }, [])

  const q = query.trim().toLowerCase()
  const results = q.length >= 2
    ? teachers.filter(t => t.name.toLowerCase().includes(q))
    : []

  return (
    <main className="max-w-2xl mx-auto pb-24">
      <header className="sticky top-0 bg-stone-900 text-white z-10 p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Orari docenti</h1>
        <Link
          href="/"
          className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
        >
          ← Calendario
        </Link>
      </header>

      <div className="p-4 space-y-3">
        <input
          type="search"
          autoFocus
          placeholder="Cerca per cognome o nome (es. Caputo, Tara…)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-stone-600"
        />

        {loading && (
          <p className="text-xs text-stone-400 text-center py-4">Caricamento…</p>
        )}

        {!loading && q.length >= 2 && results.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-4">
            Nessun docente trovato per &ldquo;{q}&rdquo;
          </p>
        )}

        {!loading && q.length < 2 && (
          <p className="text-xs text-stone-400 text-center py-2">
            {teachers.length} docenti · digita almeno 2 lettere
          </p>
        )}

        <div className="space-y-3">
          {results.map(t => <TeacherCard key={t.name} teacher={t} />)}
        </div>
      </div>
    </main>
  )
}
