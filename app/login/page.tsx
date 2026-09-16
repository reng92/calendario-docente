'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, Eye, EyeOff } from 'lucide-react'
import { Field, inputCls, PrimaryButton } from '@/components/form'
import { SCHOOL_NAME, SCHOOL_CITY } from '@/lib/schedule'
import { cn } from '@/components/utils'

function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        window.location.href = next && next.startsWith('/') ? next : '/oggi'
        return
      }
      setError(res.status === 401 ? 'Password non corretta. Riprova.' : 'Accesso non riuscito. Riprova tra poco.')
    } catch {
      setError('Nessuna connessione. Controlla la rete e riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Password" htmlFor="password">
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
            className={cn(inputCls, 'pr-12', error && 'border-danger')}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            aria-label={show ? 'Nascondi password' : 'Mostra password'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
          >
            {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      </Field>
      {error && (
        <p id="login-error" role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-small text-danger">
          {error}
        </p>
      )}
      <PrimaryButton type="submit" disabled={loading || password.length === 0}>
        {loading ? 'Verifica…' : 'Entra'}
      </PrimaryButton>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-card bg-accent text-accent-ink">
            <CalendarDays className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-title text-ink">Calendario docente</h1>
            <p className="text-small text-muted">{SCHOOL_NAME} · {SCHOOL_CITY}</p>
          </div>
        </div>
        <div className="rounded-card border border-line bg-surface p-5">
          <p className="mb-4 text-body text-ink">Inserisci la password per aprire il calendario su questo dispositivo.</p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-caption font-normal text-muted">
          L’accesso resta attivo per un anno su questo dispositivo.
        </p>
      </div>
    </main>
  )
}
