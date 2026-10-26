/**
 * Etichette e colori condivisi dell'interfaccia (unica copia).
 * I colori degli eventi sono variabili CSS definite in app/globals.css,
 * così cambiano automaticamente in dark mode.
 */

export const EVENT_KINDS: Record<string, { label: string; short: string; color: string }> = {
  collegio:     { label: 'Collegio docenti',     short: 'Collegio',     color: 'var(--ev-collegio)' },
  cdc:          { label: 'Consiglio di classe',  short: 'CdC',          color: 'var(--ev-cdc)' },
  glo:          { label: 'GLO (inclusione)',     short: 'GLO',          color: 'var(--ev-glo)' },
  dipartimento: { label: 'Dipartimento',         short: 'Dipartimento', color: 'var(--ev-dipartimento)' },
  colloqui:     { label: 'Colloqui',             short: 'Colloqui',     color: 'var(--ev-colloqui)' },
  scrutini:     { label: 'Scrutini',             short: 'Scrutini',     color: 'var(--ev-scrutini)' },
  sorveglianza: { label: 'Sorveglianza',         short: 'Sorveglianza', color: 'var(--ev-sorveglianza)' },
}

/** Turno di sorveglianza in ricreazione: va mostrato sulla riga dell'intervallo, non nel pomeriggio */
export function isSorveglianza(kind: string): boolean {
  return kind === 'sorveglianza'
}

/**
 * Separa il turno di sorveglianza dagli altri impegni del giorno. Se nessuna
 * lezione del giorno è seguita da un intervallo (`hasBreak` falso) il turno
 * resta tra gli impegni, così non sparisce.
 */
export function splitSorveglianza<M extends { kind: string }>(meetings: M[], hasBreak: boolean): { duty: M | null; others: M[] } {
  const duty = hasBreak ? meetings.find(m => isSorveglianza(m.kind)) ?? null : null
  return { duty, others: duty ? meetings.filter(m => m !== duty) : meetings }
}

/**
 * Dove mostrare gli intervalli tra le lezioni del giorno (`hours` ordinate):
 * chiave = indice della lezione dopo cui cade l'intervallo, -1 = prima della
 * prima lezione. In testa o in coda solo se c'è un turno da mostrare
 * (`withDuty`), così il turno compare anche quando l'ora prima è libera.
 */
export function breakPositions(hours: number[], breaks: Record<number, string>, withDuty: boolean): Map<number, string> {
  const pos = new Map<number, string>()
  if (!hours.length) return pos
  for (const [h, label] of Object.entries(breaks)) {
    const i = hours.findLastIndex(x => x <= Number(h))
    if (withDuty || (i >= 0 && i < hours.length - 1)) pos.set(i, label)
  }
  return pos
}

/** Tipi del modulo impegni: la sorveglianza è un turno in ricreazione, non un impegno pomeridiano */
export const EVENT_KIND_OPTIONS = Object.entries(EVENT_KINDS)
  .filter(([value]) => !isSorveglianza(value))
  .map(([value, k]) => ({ value, label: k.label }))

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
