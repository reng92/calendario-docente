'use client'

import { useState, useEffect } from 'react'

type InstallPrompt = Event & { prompt: () => Promise<void> }

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    ) {
      setInstalled(true)
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as InstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed) return null

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      setDeferredPrompt(null)
      setInstalled(true)
    } else {
      setShowHint(h => !h)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        style={{ position: 'fixed', bottom: 24, right: 16, zIndex: 9999, background: '#1c1917', color: 'white', borderRadius: 9999, padding: '10px 18px', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer' }}
      >
        📲 Installa app
      </button>
      {showHint && (
        <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 9999, width: 260, background: '#292524', color: 'white', borderRadius: 12, padding: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', fontSize: 13 }}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Come installare</p>
          <p style={{ color: '#d6d3d1' }}><strong>Android:</strong> menu ⋮ → "Installa app"</p>
          <p style={{ color: '#d6d3d1', marginTop: 6 }}><strong>iPhone Safari:</strong> Condividi □↑ → "Aggiungi a schermata Home"</p>
          <button onClick={() => setShowHint(false)} style={{ marginTop: 10, color: '#a8a29e', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Chiudi</button>
        </div>
      )}
    </>
  )
}
