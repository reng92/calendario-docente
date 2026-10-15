/**
 * Impegni collegiali previsti dal planning annuale d'istituto 2026/27
 * (Planning_IPSIA LICEO.pdf), filtrati sulle mie classi: 1–4 MAN, 4IAN
 * (triennio IAN), 2LSA (liceo scienze applicate).
 *
 * Servono solo alla previsione del monte ore: non compaiono nel calendario.
 * Per i consigli di classe il planning dà la fascia dell'indirizzo, non
 * l'orario della singola classe: `min` è una stima (1 h a classe, di più
 * dove la fascia è più lunga). Se registri l'impegno vero nello stesso
 * giorno e comma, la voce del planning viene ignorata.
 *
 * Esclusi: scrutini (fuori tetto), formazione, gruppi di lavoro di cui non
 * faccio parte (NIV, BES, GLI, tutor, monovalente), assemblea per le elezioni.
 */

export type PlanningItem = {
  date: string
  kind: 'collegio' | 'dipartimento' | 'colloqui' | 'cdc'
  title: string
  min: number
  /** Fascia oraria del planning */
  fascia: string
}

export const PLANNING: PlanningItem[] = [
  // Lett. a — collegio, dipartimenti, famiglie
  { date: '2026-11-19', kind: 'colloqui', title: 'Ricevimento pomeridiano famiglie', min: 240, fascia: '15:00–19:00' },
  { date: '2026-12-17', kind: 'collegio', title: 'Collegio docenti · PTOF', min: 120, fascia: '17:30–19:30' },
  { date: '2027-02-12', kind: 'collegio', title: 'Collegio docenti', min: 120, fascia: '15:00–17:00' },
  { date: '2027-04-01', kind: 'colloqui', title: 'Ricevimento pomeridiano famiglie', min: 240, fascia: '15:00–19:00' },
  { date: '2027-04-26', kind: 'dipartimento', title: 'Dipartimenti · libri di testo', min: 120, fascia: '15:00–17:00' },
  { date: '2027-05-13', kind: 'collegio', title: 'Collegio docenti', min: 105, fascia: '14:45–16:30' },
  { date: '2027-06-24', kind: 'collegio', title: 'Collegio docenti unificato', min: 180, fascia: '16:30–19:30' },

  // Lett. b — consigli di classe
  { date: '2026-11-09', kind: 'cdc', title: 'Consigli di classe 1–4 MAN', min: 240, fascia: '15:00–19:00' },
  { date: '2026-11-13', kind: 'cdc', title: 'Consiglio di classe 4IAN', min: 60, fascia: '14:00–17:00' },
  { date: '2026-11-17', kind: 'cdc', title: 'Consiglio di classe 2LSA', min: 60, fascia: '14:00–19:00' },
  { date: '2027-03-09', kind: 'cdc', title: 'Consiglio di classe 2LSA', min: 60, fascia: '14:00–18:00' },
  { date: '2027-03-11', kind: 'cdc', title: 'Consigli di classe 1–4 MAN', min: 240, fascia: '14:00–18:00' },
  { date: '2027-03-17', kind: 'cdc', title: 'Consiglio di classe 4IAN', min: 60, fascia: '15:00–17:00' },
  { date: '2027-05-03', kind: 'cdc', title: 'Consiglio di classe 4IAN', min: 60, fascia: '15:00–17:30' },
  { date: '2027-05-07', kind: 'cdc', title: 'Consigli di classe 1–4 MAN', min: 300, fascia: '14:00–19:00' },
  { date: '2027-05-12', kind: 'cdc', title: 'Consiglio di classe 2LSA', min: 75, fascia: '15:00–20:00' },
]
