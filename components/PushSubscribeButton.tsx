'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { cn } from '@/components/utils'

type PushState = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array([...raw].map(c => c.charCodeAt(0)))
  return arr.buffer as ArrayBuffer
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function PushSubscribeButton() {
  const [state, setState] = useState<PushState>('loading')
  const [busy, setBusy] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      setIosHint(isIOS() && !isStandalone())
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  async function subscribe() {
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
          },
          deviceLabel: navigator.userAgent.slice(0, 50),
        }),
      })
      setState('subscribed')
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('unsubscribed')
    } finally {
      setBusy(false)
    }
  }

  const Icon = state === 'subscribed' ? BellRing : state === 'denied' ? BellOff : Bell
  const title =
    state === 'subscribed' ? 'Notifiche attive'
    : state === 'denied' ? 'Notifiche bloccate'
    : state === 'unsupported' ? 'Notifiche non disponibili'
    : state === 'loading' ? 'Notifiche'
    : 'Notifiche disattivate'
  const description =
    state === 'subscribed' ? 'Promemoria 10 minuti prima di ogni lezione e avviso per le nuove circolari, su questo dispositivo.'
    : state === 'denied' ? 'Il browser blocca le notifiche per questo sito. Riattivale dalle impostazioni del sito nel browser, poi torna qui.'
    : state === 'unsupported' ? (iosHint
        ? 'Su iPhone le notifiche funzionano solo dopo aver aggiunto l’app alla schermata Home: Condividi → Aggiungi alla schermata Home.'
        : 'Questo browser non supporta le notifiche push.')
    : state === 'loading' ? 'Controllo dello stato in corso…'
    : 'Ricevi un promemoria 10 minuti prima di ogni lezione e un avviso per le nuove circolari.'

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className={cn(
        'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full',
        state === 'subscribed' ? 'bg-ok-soft text-ok' : state === 'denied' ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-muted',
      )}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-small text-muted">{description}</p>
        {(state === 'subscribed' || state === 'unsubscribed') && (
          <button
            type="button"
            onClick={state === 'subscribed' ? unsubscribe : subscribe}
            disabled={busy}
            className={cn(
              'mt-3 inline-flex min-h-11 items-center justify-center rounded-control px-4 text-small font-semibold disabled:opacity-50',
              state === 'subscribed'
                ? 'border border-line text-ink hover:bg-surface-2'
                : 'bg-accent text-accent-ink hover:opacity-90',
            )}
          >
            {busy ? 'Un momento…' : state === 'subscribed' ? 'Disattiva su questo dispositivo' : 'Attiva le notifiche'}
          </button>
        )}
      </div>
    </div>
  )
}
