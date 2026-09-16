'use client'

import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/components/utils'

type Pref = 'system' | 'light' | 'dark'

const OPTIONS: { value: Pref; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistema', Icon: Monitor },
  { value: 'light', label: 'Chiaro', Icon: Sun },
  { value: 'dark', label: 'Scuro', Icon: Moon },
]

function readPref(): Pref {
  try {
    const t = localStorage.getItem('theme')
    return t === 'dark' || t === 'light' ? t : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(pref: Pref) {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = pref === 'dark' || (pref === 'system' && systemDark)
  document.documentElement.classList.toggle('dark', dark)
  try {
    if (pref === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', pref)
  } catch {}
  // allinea la barra di stato del browser/PWA al tema effettivo
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')
    ?? (() => { const m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); return m })()
  meta.content = dark ? '#171e2b' : '#ffffff'
}

/** Selettore tema a tre stati (Sistema / Chiaro / Scuro), stile segmented control */
export function ThemeToggle() {
  const [pref, setPref] = useState<Pref>('system')
  useEffect(() => { setPref(readPref()) }, [])

  function choose(p: Pref) {
    setPref(p)
    applyTheme(p)
  }

  return (
    <div role="radiogroup" aria-label="Tema" className="flex rounded-control bg-surface-2 p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = pref === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(value)}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[8px] text-small font-semibold transition-colors',
              active ? 'bg-surface text-ink shadow-[0_1px_0_var(--line)]' : 'text-muted',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
