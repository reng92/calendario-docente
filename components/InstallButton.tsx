'use client'

import { useState, useEffect } from 'react'

export function InstallButton() {
  const [prompt, setPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as Event & { prompt: () => Promise<void> })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt) return null

  return (
    <button
      onClick={async () => { await prompt.prompt(); setPrompt(null) }}
      className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
    >
      Installa
    </button>
  )
}
