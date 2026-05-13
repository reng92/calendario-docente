'use client'

import { useState, useEffect } from 'react'

type PushState = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array([...raw].map(c => c.charCodeAt(0)))
  return arr.buffer as ArrayBuffer
}

export function PushSubscribeButton({ compact }: { compact?: boolean } = {}) {
  const [state, setState] = useState<PushState>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
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

  if (state === 'loading') return null
  if (state === 'unsupported') return null

  if (compact) {
    if (state === 'denied') return null
    if (state === 'subscribed') return (
      <button
        onClick={unsubscribe}
        disabled={busy}
        title="Notifiche attive — clicca per disattivare"
        className="text-lg leading-none"
      >🔔</button>
    )
    return (
      <button
        onClick={subscribe}
        disabled={busy}
        title="Attiva notifiche push"
        className="text-lg leading-none opacity-40 hover:opacity-100"
      >🔔</button>
    )
  }

  if (state === 'denied') return (
    <p className="text-xs text-red-500">Notifiche bloccate. Abilitale nelle impostazioni del browser.</p>
  )

  return (
    <div className="flex flex-col gap-2">
      {state === 'subscribed' ? (
        <>
          <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Notifiche attive
          </div>
          <button
            onClick={unsubscribe}
            disabled={busy}
            className="text-xs text-stone-400 hover:text-red-600 underline"
          >
            {busy ? '...' : 'Disattiva'}
          </button>
        </>
      ) : (
        <button
          onClick={subscribe}
          disabled={busy}
          className="rounded-lg bg-stone-900 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
        >
          {busy ? 'Attivazione...' : '🔔 Attiva notifiche push'}
        </button>
      )}
    </div>
  )
}
