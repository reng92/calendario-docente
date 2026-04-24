'use client'

export function DeleteButton({ id, action }: { id: string; action: (id: string) => Promise<void> }) {
  async function handle() {
    if (!confirm('Eliminare?')) return
    await action(id)
  }
  return (
    <button onClick={handle} className="text-red-600 text-xs font-semibold hover:underline">
      Elimina
    </button>
  )
}
