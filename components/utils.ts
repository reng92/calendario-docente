import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge deve conoscere i token custom definiti in globals.css,
 * altrimenti tratta `text-display` come un colore e lo scarta quando
 * è combinato con `text-ink`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'title', 'heading', 'body', 'small', 'caption'],
      color: ['bg', 'surface', 'surface-2', 'ink', 'muted', 'line', 'accent', 'accent-soft', 'accent-ink', 'danger', 'danger-soft', 'warn', 'warn-soft', 'ok', 'ok-soft'],
      radius: ['card', 'control', 'chip'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
