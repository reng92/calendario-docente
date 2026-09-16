/**
 * Etichette e colori condivisi dell'interfaccia (unica copia).
 * I colori degli eventi sono variabili CSS definite in app/globals.css,
 * così cambiano automaticamente in dark mode.
 */

export const EVENT_KINDS: Record<string, { label: string; short: string; color: string }> = {
  collegio:     { label: 'Collegio docenti',     short: 'Collegio',     color: 'var(--ev-collegio)' },
  cdc:          { label: 'Consiglio di classe',  short: 'CdC',          color: 'var(--ev-cdc)' },
  dipartimento: { label: 'Dipartimento',         short: 'Dipartimento', color: 'var(--ev-dipartimento)' },
  colloqui:     { label: 'Colloqui',             short: 'Colloqui',     color: 'var(--ev-colloqui)' },
  scrutini:     { label: 'Scrutini',             short: 'Scrutini',     color: 'var(--ev-scrutini)' },
}

export const EVENT_KIND_OPTIONS = Object.entries(EVENT_KINDS).map(([value, k]) => ({ value, label: k.label }))

export function eventColor(kind: string): string {
  return EVENT_KINDS[kind]?.color ?? 'var(--muted)'
}

export function eventLabel(kind: string): string {
  return EVENT_KINDS[kind]?.label ?? kind
}

export const OVERRIDE_KINDS: Record<string, { label: string; short: string }> = {
  cover:    { label: 'Supplenza',                   short: 'Supplenza' },
  assembly: { label: 'Assemblea',                   short: 'Assemblea' },
  strike:   { label: 'Sciopero',                    short: 'Sciopero' },
  padel:    { label: 'Padel (Racchette in Classe)', short: 'Padel' },
  custom:   { label: 'Altro',                       short: 'Variazione' },
}

export const OVERRIDE_KIND_OPTIONS = Object.entries(OVERRIDE_KINDS).map(([value, k]) => ({ value, label: k.label }))

export function overrideLabel(kind: string): string {
  return OVERRIDE_KINDS[kind]?.label ?? kind
}

/** Classe "a disposizione / propria classe": si riconosce dal codice */
export function isDisposizione(code: string | null | undefined): boolean {
  return code === 'D'
}

/** Style inline per chip/barra di classe: imposta --cls dal colore salvato nel DB */
export function classVar(color: string | null | undefined): React.CSSProperties {
  return { ['--cls' as string]: color ?? 'var(--muted)' }
}

/** Etichette delle sorgenti circolari */
export const SOURCE_LABELS: Record<string, string> = {
  scuola: 'Scuola',
  usp_roma: 'USP Roma',
  usr_lazio: 'USR Lazio',
}
