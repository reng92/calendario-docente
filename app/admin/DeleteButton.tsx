'use client'

import { useRouter } from 'next/navigation'

export function DeleteButton({ id, action }: { id: string; action: (id: string) => Promise<void> }) {
  const router = useRouter()
  async function handle() {
    if (!confirm('Eliminare?')) return
    await action(id)
    router.refresh()
  }
  return (
    <button onClick={handle} className="text-red-600 text-xs font-semibold hover:underline">
      Elimina
    </button>
  )
}
