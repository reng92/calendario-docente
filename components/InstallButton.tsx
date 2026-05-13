'use client'

import { useState, useEffect } from 'react'

type InstallPrompt = Event & { prompt: () => Promise<void> }

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null)
  const [isStandalone, setIsStandalone] = useState(true)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    // Hide button if already installed as PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as InstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone) return null

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      setDeferredPrompt(null)
    } else {
      setShowHint(h => !h)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
      >
        Installa
      </button>
      {showHint && (
        <div className="absolute right-0 top-9 w-64 bg-stone-800 text-white text-xs rounded-xl p-3 shadow-xl z-50">
          <p className="font-bold mb-1">Installa l'app</p>
          <p className="text-stone-300">
            Android: menu ⋮ → "Installa app" o "Aggiungi a schermata Home"
          </p>
          <p className="text-stone-300 mt-1">
            iPhone: Safari → Condividi □↑ → "Aggiungi a schermata Home"
          </p>
          <button onClick={() => setShowHint(false)} className="mt-2 text-stone-400 underline">Chiudi</button>
        </div>
      )}
    </div>
  )
}
