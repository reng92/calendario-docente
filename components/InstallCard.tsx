'use client'

import { useEffect, useState } from 'react'
import { Download, Smartphone } from 'lucide-react'

type InstallPrompt = Event & { prompt: () => Promise<void> }

/** Riga "Installa app": usa il prompt nativo dove esiste, altrimenti spiega come fare */
export function InstallCard() {
  const [deferred, setDeferred] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState<boolean | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setInstalled(standalone)
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent))
    const handler = (e: Event) => { e.preventDefault(); setDeferred(e as InstallPrompt) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed === null) return null

  async function handleClick() {
    if (deferred) {
      await deferred.prompt()
      setDeferred(null)
      setInstalled(true)
    } else {
      setShowHint(h => !h)
    }
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Smartphone className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink">{installed ? 'App installata' : 'Installa sul telefono'}</p>
        <p className="mt-0.5 text-small text-muted">
          {installed
            ? 'Stai usando la versione installata: si apre su Oggi e riceve le notifiche.'
            : 'Aggiungila alla schermata Home per aprirla come un’app e ricevere le notifiche.'}
        </p>
        {!installed && (
          <button
            type="button"
            onClick={handleClick}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-line px-4 text-small font-semibold text-ink hover:bg-surface-2"
          >
            <Download className="size-4" aria-hidden />
            {deferred ? 'Installa' : showHint ? 'Nascondi istruzioni' : 'Come si installa'}
          </button>
        )}
        {showHint && !installed && (
          <ol className="mt-3 space-y-1.5 rounded-control bg-surface-2 px-3 py-2 text-small text-ink">
            {ios ? (
              <>
                <li>1. Apri questa pagina in Safari.</li>
                <li>2. Tocca Condividi (il quadrato con la freccia).</li>
                <li>3. Scegli “Aggiungi alla schermata Home”.</li>
              </>
            ) : (
              <>
                <li>1. Apri il menu del browser (⋮).</li>
                <li>2. Scegli “Installa app” o “Aggiungi a schermata Home”.</li>
              </>
            )}
          </ol>
        )}
      </div>
    </div>
  )
}
