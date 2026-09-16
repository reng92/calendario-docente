'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet'
import { cn } from '@/components/utils'

const FormSheetContext = createContext<(() => void) | null>(null)

/** Da usare dentro un form montato in <FormSheet>: chiude il foglio dopo il salvataggio */
export function useFormSheetClose(): () => void {
  const close = useContext(FormSheetContext)
  return close ?? (() => {})
}

type Props = {
  title: string
  description?: string
  /** Etichetta del bottone che apre il foglio */
  triggerLabel?: string
  triggerClassName?: string
  triggerVariant?: 'primary' | 'text'
  /** Contenuto custom del bottone (es. un'icona); sostituisce icona + e etichetta */
  triggerContent?: ReactNode
  children: ReactNode
}

/** Bottone che apre un foglio dal basso con un form dentro */
export function FormSheet({ title, description, triggerLabel, triggerClassName, triggerVariant = 'primary', triggerContent, children }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={triggerLabel || title}
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control px-3 text-small font-semibold',
          triggerVariant === 'primary' ? 'bg-accent text-accent-ink hover:opacity-90' : 'text-accent hover:bg-surface-2',
          triggerClassName,
        )}
      >
        {triggerContent ?? (
          <>
            {triggerVariant === 'primary' && <Plus className="size-4" aria-hidden />}
            {triggerLabel}
          </>
        )}
      </button>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[92dvh] max-w-xl overflow-y-auto rounded-t-[20px] border-line px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetTitle className="text-title text-ink">{title}</SheetTitle>
            <SheetDescription className={cn('text-small text-muted', !description && 'sr-only')}>
              {description ?? title}
            </SheetDescription>
          </div>
          <SheetClose
            aria-label="Chiudi"
            className="-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-5" />
          </SheetClose>
        </div>
        <FormSheetContext.Provider value={close}>
          <div className="mt-4">{children}</div>
        </FormSheetContext.Provider>
      </SheetContent>
    </Sheet>
  )
}
