'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DangerButton, SecondaryButton } from '@/components/form'

export function DeleteButton({ id, action, what }: { id: string; action: (id: string) => Promise<void>; what?: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function confirm() {
    setBusy(true)
    try {
      await action(id)
      setOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Elimina${what ? ` ${what}` : ''}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 className="size-5" aria-hidden />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm rounded-card border-line p-5">
          <DialogTitle className="text-heading text-ink">Eliminare{what ? ` ${what}` : ''}?</DialogTitle>
          <DialogDescription className="text-small text-muted">
            L’elemento sparisce dal calendario. L’operazione non si può annullare.
          </DialogDescription>
          <div className="mt-2 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setOpen(false)} disabled={busy}>Annulla</SecondaryButton>
            <DangerButton type="button" onClick={confirm} disabled={busy}>{busy ? 'Elimino…' : 'Elimina'}</DangerButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
