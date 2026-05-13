'use client'

import { useState, useEffect } from 'react'

type InstallPrompt = Event & { prompt: () => Promise<void> }

export function InstallButton() {
  const [hidden, setHidden] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    ) {
      setHidden(true)
      return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as InstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (hidden) return null

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      setDeferredPrompt(null)
      setHidden(true)
    } else {
      setShowHint(h => !h)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-4 z-50 bg-stone-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2"
      >
        📲 Installa app
      </button>
      {showHint && (
        <div className="fixed bottom-20 right-4 z-50 w-64 bg-stone-800 text-white text-xs rounded-xl p-3 shadow-xl">
          <p className="font-bold mb-1">Come installare</p>
          <p className="text-stone-300 mt-1">
            <strong>Android Chrome:</strong> menu ⋮ in alto a destra → "Installa app" o "Aggiungi a schermata Home"
          </p>
          <p className="text-stone-300 mt-2">
            <strong>iPhone Safari:</strong> pulsante Condividi □↑ in basso → "Aggiungi a schermata Home"
          </p>
          <button onClick={() => setShowHint(false)} className="mt-3 text-stone-400 underline text-xs">Chiudi</button>
        </div>
      )}
    </>
  )
}
