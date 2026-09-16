import type { ReactNode } from 'react'
import { cn } from '@/components/utils'

/** Classi condivise per i controlli dei form di gestione (44px, token del tema) */
export const inputCls =
  'w-full min-h-11 rounded-control border border-line bg-surface px-3 text-body text-ink placeholder:text-muted/70 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30'
export const selectCls = cn(inputCls, 'appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%235b6472%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27><path d=%27m6 9 6 6 6-6%27/></svg>")] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat pr-9')
export const textareaCls = cn(inputCls, 'min-h-20 py-2.5')

export function Field({ label, htmlFor, hint, children, className }: {
  label: string; htmlFor?: string; hint?: string; children: ReactNode; className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={htmlFor} className="block text-small font-semibold text-ink">{label}</label>
      {children}
      {hint && <p className="text-caption font-normal text-muted">{hint}</p>}
    </div>
  )
}

export function PrimaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn('inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accent px-4 text-body font-semibold text-accent-ink hover:opacity-90 disabled:opacity-50', className)}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn('inline-flex min-h-11 items-center justify-center rounded-control border border-line bg-surface px-4 text-small font-semibold text-ink hover:bg-surface-2 disabled:opacity-50', className)}
    >
      {children}
    </button>
  )
}

export function DangerButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn('inline-flex min-h-11 items-center justify-center rounded-control bg-danger px-4 text-small font-semibold text-white hover:opacity-90 disabled:opacity-50', className)}
    >
      {children}
    </button>
  )
}
