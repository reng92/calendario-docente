# Calendario Docente — PWA con notifiche push

> File di contesto per Claude Code. Leggere **per intero** prima di iniziare a scrivere codice. Quando in dubbio su una scelta, fermarsi e chiedere all'utente.

---

## 1. Contesto del progetto

App Next.js esistente per gestire l'orario settimanale di un docente di scuola secondaria (IIS Einstein-Bachelet, Roma). Già deployata su Vercel: https://calendario-docente.vercel.app/

**Stack attuale**:
- Next.js (App Router) + TypeScript
- Database: **Supabase** (Postgres + Auth)
- Hosting: Vercel
- Repo: GitHub
- ⚠️ Supabase è **già connesso a VS Code** via MCP: puoi applicare migration, ispezionare lo schema ed eseguire query direttamente. **Usa quelle tool** invece di chiedere all'utente di copia-incollare SQL.

**Obiettivo di questa iterazione**: trasformare l'app in **PWA installabile** con tre flussi di notifiche push:

1. **Promemoria lezioni**: 10 minuti prima di ogni lezione, push con classe, materia, aula, eventuale co-docente.
2. **Circolari scuola**: notifica quando viene pubblicata una nuova circolare sul sito IIS Einstein-Bachelet.
3. **Avvisi USP/USR**: notifica quando viene pubblicato un nuovo avviso sul sito dell'Ufficio Scolastico Provinciale di Roma / USR Lazio.

---

## 2. Vincoli (NON NEGOZIABILI)

⚠️ **Tutto deve essere gratuito**. Niente upgrade a Vercel Pro, niente servizi a pagamento.

Conseguenze:
- **Vercel Hobby**: i cron job hanno frequenza minima giornaliera → inutilizzabili per le lezioni. Usare cron esterno (vedi sezione 4).
- **Funzioni serverless**: max 60s di esecuzione, ampiamente sufficiente.
- **Supabase free tier**: 500 MB DB, 50.000 utenti auth, 2 GB egress/mese. Le tabelle di questo progetto sono piccolissime, ampiamente nel free.
- **Niente Vercel KV / Upstash / Redis**: tutto in Supabase Postgres.

---

## 3. Architettura ad alto livello

```
┌─────────────────────┐       push        ┌─────────────────────┐
│  Service Worker     │ ←──────────────── │  Vercel Functions   │
│  (Serwist)          │                   │  (API routes)       │
└──────────┬──────────┘                   └──────────┬──────────┘
           │                                         │
   subscribe / show                          web-push send
           │                                         │
┌──────────▼──────────┐                   ┌──────────▼──────────┐
│  Browser PWA        │                   │  Supabase Postgres  │
│  (Next.js client)   │                   │  (subscriptions,    │
└─────────────────────┘                   │   circolari_seen,   │
                                          │   notification_log) │
                                          └──────────▲──────────┘
                                                     │
                              ┌──────────────────────┴────┐
                              │  GitHub Actions (cron)    │
                              │  ogni 5 min, 7-15 lun-sab │
                              │  → fetch /api/cron/*      │
                              └───────────────────────────┘
```

---

## 4. Trigger: GitHub Actions invece di Vercel Cron

File `.github/workflows/cron.yml`:

```yaml
name: Cron
on:
  schedule:
    # Lezioni: ogni 5 minuti, 6:00–13:00 UTC (≈ 7-14 ora legale IT / 8-15 ora solare), lun–sab
    - cron: "*/5 6-13 * * 1-6"
    # Circolari: ogni ora dalle 6 alle 19 UTC
    - cron: "0 6-19 * * *"
jobs:
  ping-lessons:
    if: github.event.schedule == '*/5 6-13 * * 1-6'
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://calendario-docente.vercel.app/api/cron/lessons
  ping-circolari:
    if: github.event.schedule == '0 6-19 * * *'
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://calendario-docente.vercel.app/api/cron/circolari
```

⚠️ GitHub Actions cron usa **UTC**. L'endpoint server deve **sempre** ragionare in fuso `Europe/Rome` (date-fns-tz o Temporal). Mai fidarsi del fuso del runner Vercel.

**Setup richiesto**:
1. Generare un valore casuale forte (es. `openssl rand -base64 32`) e metterlo come secret `CRON_SECRET` sia in GitHub (Settings → Secrets and variables → Actions) che in Vercel (Project → Environment Variables).
2. Tutti gli endpoint `/api/cron/*` verificano l'header `Authorization: Bearer ${CRON_SECRET}` e rispondono 401 altrimenti.

---

## 5. Schema Supabase

Claude Code deve **applicare le migration direttamente via Supabase MCP**, non chiedere all'utente di farlo dalla dashboard.

Tabelle da creare:

```sql
-- Sottoscrizioni push: un utente può avere più dispositivi
create table public.push_subscriptions (
  id              bigserial primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  endpoint        text not null unique,
  p256dh          text not null,
  auth            text not null,
  device_label    text,
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions(user_id);

-- Sorgenti circolari da monitorare (configurabile, non hardcoded)
create table public.sources (
  id        bigserial primary key,
  key       text not null unique,           -- "scuola" | "usp_roma" | "usr_lazio"
  label     text not null,
  url       text not null,                  -- pagina elenco circolari o feed
  kind      text not null check (kind in ('rss','html')),
  selector  text,                           -- per html: selettore cheerio articoli
  keywords  text[],                         -- filtro opzionale: notifica solo se titolo matcha
  active    boolean not null default true
);

-- Deduplica: cosa abbiamo già visto/notificato
create table public.circolari_seen (
  id              bigserial primary key,
  source_key      text not null references public.sources(key),
  external_id     text not null,            -- guid RSS o hash url+titolo
  titolo          text not null,
  url             text not null,
  pubblicata_il   timestamptz,
  notificata_il   timestamptz,
  created_at      timestamptz not null default now(),
  unique (source_key, external_id)
);

-- Log per evitare doppioni nelle notifiche lezioni
create table public.notification_log (
  id           bigserial primary key,
  kind         text not null,               -- "lesson" | "circolare"
  dedupe_key   text not null,               -- es. "lesson:123:2026-05-13"
  sent_at      timestamptz not null default now(),
  unique (kind, dedupe_key)
);
```

### Row Level Security (CRITICO)

```sql
-- push_subscriptions: ogni utente vede solo le proprie
alter table public.push_subscriptions enable row level security;

create policy "users read own subs" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "users insert own subs" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "users delete own subs" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- sources, circolari_seen, notification_log: scritte solo dal service role (cron)
-- non serve policy SELECT per il client a meno di voler mostrare in UI uno storico circolari.
alter table public.sources enable row level security;
alter table public.circolari_seen enable row level security;
alter table public.notification_log enable row level security;

-- Esempio: permettere agli autenticati di leggere lo storico circolari (se serve in UI)
create policy "authenticated read circolari" on public.circolari_seen
  for select using (auth.role() = 'authenticated');
```

⚠️ Gli endpoint cron usano la **service role key** che bypassa RLS — non c'è bisogno di policy INSERT su queste tabelle.

### Verifica con MCP
Dopo aver applicato la migration, Claude Code deve eseguire `list_tables` o equivalente per confermare che lo schema sia stato creato correttamente, e riportare l'esito.

---

## 6. Variabili d'ambiente

In `.env.local` (e in Vercel Project Settings):

```
# Supabase (già esistenti per l'app attuale)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # SOLO server-side, mai esposto al client

# Web Push (nuovo)
VAPID_PUBLIC_KEY=...                 # genera con: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:tua@email.it
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...     # stesso valore di VAPID_PUBLIC_KEY, esposto al client

# Cron
CRON_SECRET=...                      # openssl rand -base64 32
```

⚠️ Verificare che `.env.local` sia in `.gitignore`. La `SUPABASE_SERVICE_ROLE_KEY` non deve **mai** finire in codice client/component.

---

## 7. Due client Supabase: anon vs service role

Per non confondere mai i due ruoli, creare due helper distinti:

```typescript
// src/lib/supabase/client.ts — per componenti client e route handler "user-facing"
import { createBrowserClient } from "@supabase/ssr";
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// src/lib/supabase/server.ts — per route handler che leggono auth dell'utente
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* ... pattern @supabase/ssr ... */ } },
  );
}

// src/lib/supabase/admin.ts — SOLO per endpoint cron, bypassa RLS
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // ⚠️ server-only
  { auth: { persistSession: false } },
);
```

**Regola d'oro**: `supabaseAdmin` è importato SOLO da file dentro `/app/api/cron/**`. Mai da componenti client.

---

## 8. Fasi di implementazione (ESEGUIRE IN ORDINE)

### Fase 1 — PWA base (senza push)
1. Installare `@serwist/next` + dipendenze.
2. Configurare `next.config.js` con il wrapper Serwist.
3. Creare `public/manifest.json` con icone 192×192, 512×512, 512×512 maskable.
4. Aggiungere `<link rel="manifest">` e meta tag iOS in `app/layout.tsx`.
5. Creare `app/sw.ts` con precache delle route principali.
6. Verificare in Lighthouse che l'app sia installabile (score PWA ≥ 90).

### Fase 2 — Infrastruttura push
1. `npm i web-push @supabase/ssr` + `npm i -D @types/web-push`.
2. Generare VAPID keys e salvarle nelle env (locale + Vercel).
3. Applicare la migration `push_subscriptions` via Supabase MCP.
4. Endpoint `POST /api/push/subscribe`:
   - Usa `supabaseServer()` per ottenere `auth.uid()`.
   - 401 se non autenticato.
   - Riceve `{ endpoint, keys: { p256dh, auth }, deviceLabel? }` dal client.
   - Upsert in `push_subscriptions` (idempotente su `endpoint`).
5. Endpoint `POST /api/push/unsubscribe` (delete by endpoint).
6. Endpoint `POST /api/push/test` — manda push di prova all'utente loggato.
7. Componente client `<PushSubscribeButton>` che:
   - Richiede permesso `Notification.requestPermission()`.
   - Registra il SW.
   - Crea subscription con `applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY)`.
   - POST a `/api/push/subscribe`.
   - Mostra stato (attivo / negato / non supportato).
8. Handler `push` nel service worker → `self.registration.showNotification(...)`.
9. Handler `notificationclick` → apre l'URL nel payload o focus della tab esistente.

### Fase 3 — Notifiche lezioni
1. Applicare migration `notification_log` via Supabase MCP.
2. Helper `getUpcomingLessons(windowMinutes = 15)`: lezioni che iniziano tra `now` e `now + 15min` in fuso `Europe/Rome`. Usa `supabaseAdmin` perché chiamato dal cron.
3. Endpoint `POST /api/cron/lessons`:
   - Verifica `CRON_SECRET` (helper riusabile, vedi sezione 9).
   - Per ogni lezione imminente:
     - `dedupeKey = \`lesson:${lessonId}:${dateISO}\``
     - INSERT in `notification_log` con `.onConflict('kind,dedupe_key').ignore()`. Se 0 righe inserite, skip.
     - Carica subscription dell'utente proprietario.
     - Manda push.
4. Payload:
   ```json
   {
     "title": "5ª A — Tecnologie Elettriche",
     "body": "Aula 23, piano 2 · tra 10 min",
     "url": "/oggi#lesson-123",
     "tag": "lesson-123"
   }
   ```
5. Gestire endpoint scaduti: se `web-push` ritorna 404/410, DELETE dalla subscription dal DB.
6. Test manuale: curl all'endpoint con `Authorization: Bearer $CRON_SECRET`.

### Fase 4 — Monitoraggio circolari scuola
1. **Ispezione manuale prima del codice**: l'utente deve fornire:
   - URL della pagina circolari di IIS Einstein-Bachelet
   - Eventuale URL del feed RSS (provare `/feed`, `/?feed=rss2`, `/category/circolari/feed/`, oppure cercare `<link rel="alternate" type="application/rss+xml">` nel sorgente)
   - Se solo HTML: il selettore degli articoli (es. `.circolare-item`, `article.post`, ecc.)
2. Applicare migration `sources` + `circolari_seen` via MCP.
3. Seed della tabella `sources` con la riga della scuola.
4. Se RSS: usare `rss-parser`, dedupe sui `guid`.
5. Se HTML: usare `cheerio`, dedupe su hash di `url + titolo`.
6. Endpoint `POST /api/cron/circolari`:
   - Per ogni `source` attiva, fetch + parse.
   - Per ogni voce non già in `circolari_seen`: INSERT + invio push a TUTTI gli utenti con subscription attiva.
   - Limite: max 5 push per esecuzione (anti-spam alla prima sync). Le altre voci vengono marcate come viste senza notifica.
7. Payload:
   ```json
   {
     "title": "Nuova circolare — Einstein-Bachelet",
     "body": "Convocazione consiglio di classe 5A",
     "url": "https://link-diretto-al-pdf...",
     "tag": "circolare-<id>"
   }
   ```

### Fase 5 — Monitoraggio USP/USR
1. Confermare con l'utente quale sito monitorare: Ambito Territoriale Roma (`https://www.ambitoterritorialerm.it/`), USR Lazio (`https://usr.lazio.it/`), o entrambi.
2. Stesso pattern Fase 4: ispezione → seed `sources` → riuso `/api/cron/circolari` (che cicla su tutte le sources attive).
3. **Usare il campo `keywords`**: per USP/USR è essenziale filtrare. Suggerimento iniziale: `["supplenze", "GPS", "B015", "A048", "AM48", "convocazion", "graduator"]`. Le voci che NON matchano nessuna keyword vengono salvate in `circolari_seen` ma senza notifica push.

---

## 9. Patterns di codice

### Verifica del cron secret (helper riusabile)
```typescript
// src/lib/auth/cron.ts
export function requireCronAuth(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
```

### Invio push con cleanup automatico
```typescript
// src/lib/push.ts
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToUser(userId: string, payload: object) {
  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !subs) return;

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
      } else {
        console.error("push error", err);
      }
    }
  }));
}

export async function sendPushToAll(payload: object) {
  const { data: users } = await supabaseAdmin
    .from("push_subscriptions")
    .select("user_id")
    .neq("user_id", null);
  const uniqueUserIds = [...new Set((users ?? []).map(u => u.user_id))];
  await Promise.all(uniqueUserIds.map(uid => sendPushToUser(uid, payload)));
}
```

### Date in Europe/Rome
Usare `date-fns-tz`:
```typescript
import { toZonedTime, fromZonedTime } from "date-fns-tz";
const TZ = "Europe/Rome";
const nowRome = toZonedTime(new Date(), TZ);
```

---

## 10. Gotchas e avvertenze

- **iOS**: le push web funzionano **solo se l'utente aggiunge l'app a Home** (iOS 16.4+). Aggiungere onboarding visivo che mostra "Condividi → Aggiungi a Home". Senza questo passaggio, su iPhone non funziona mai.
- **GitHub Actions cron non è preciso**: può ritardare di qualche minuto in caso di carico. La finestra "prossime lezioni" deve essere ampia (15 min) per assorbire ritardi.
- **GitHub Actions disabilita cron in repo inattivi**: dopo 60 giorni senza commit, i cron si fermano. Mitigation: commit periodico (anche solo aggiornare un file timestamp) o `workflow_dispatch` manuale ogni tanto.
- **Service Worker scope**: deve essere alla root (`/sw.js`). Serwist lo configura correttamente di default.
- **Scraping fragile**: se la scuola cambia sito, lo scraper si rompe in silenzio. Se un parsing ritorna 0 risultati per >24h, mandare push di alert all'utente: "Lo scraping di [fonte] non ritorna risultati, controllare".
- **`tag` nel payload**: evita duplicati sullo stesso device se l'utente apre più tab.
- **Privacy payload push**: il payload non è cifrato end-to-end verso il push service (Apple/Google). Mettere solo info necessarie per l'apertura, non dati sensibili.
- **Service role key in client**: errore catastrofico. Se Claude Code la importa in un file dentro `app/(qualsiasi)/page.tsx` o componente client, FERMARSI.

---

## 11. Definition of done per ogni fase

- [ ] Build Next.js passa senza errori e warning di tipo.
- [ ] Lighthouse PWA score ≥ 90 (fase 1 in poi).
- [ ] Test manuale documentato in commit message (es. "tested on Chrome desktop + Safari iPhone").
- [ ] `.env.example` aggiornato con le nuove variabili.
- [ ] Env aggiornate in Vercel production.
- [ ] Migration applicate e verificate via Supabase MCP.

---

## 12. Come lavorare con questo file

- **All'avvio sessione**: leggere TUTTO questo file prima di proporre modifiche.
- **Plan Mode**: generare un `plan.md` con la fase corrente + sotto-task atomici.
- **Domande prima del codice**: fase 4 e 5 richiedono input dell'utente su URL/struttura dei siti — chiedere prima di scrivere lo scraper.
- **Commit**: piccoli, atomici, in italiano. Branch per ogni fase: `feat/pwa-base`, `feat/push-infra`, `feat/lesson-notifications`, `feat/circolari-scuola`, `feat/circolari-usp`.
- **Migration**: applicarle direttamente via Supabase MCP, mai chiedere all'utente di copiare SQL nella dashboard.
- **Non sovra-ingegnerizzare**: l'app ha 1-pochi utenti. Niente queue, niente Redis, niente microservizi. Supabase + Vercel functions bastano.
