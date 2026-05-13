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
          <Link key={s.href} href={s.href} className="block bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3 hover:border-stone-400 dark:hover:border-stone-500 transition">
            <div className="font-bold">{s.label}</div>
            <div className="text-xs text-stone-500 dark:text-stone-400">{s.desc}</div>
          </Link>
        ))}
        <p className="text-xs text-stone-400 dark:text-stone-500 px-1 pt-2">Per modificare orario settimanale, classi e compresenze usa <code>pnpm db:studio</code> in locale.</p>
      </div>
    </main>
  )
}
