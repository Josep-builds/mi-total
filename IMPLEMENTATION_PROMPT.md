# IMPLEMENTATION PROMPT — Mi Total (Week 10 · MONEY)

Paste everything below the line into your coding agent. Keep `docs/PACKET.md` in the repo so the agent can read it.

---

You are building **Mi Total**, a small web app described in `docs/PACKET.md`. Read that file first. Build it as small, testable features, in the order below. After each feature: run it, check the acceptance criteria, then stop and give me the exact commit message. Do not start the next feature until I confirm.

## Hard rules (never break these)
1. **Shadow clause.** Screenshots are processed in memory inside one serverless call and never written to disk, database, logs or storage. Debt rows (lender, amounts, dates, CAT) live only in the browser (`localStorage`, wrapped in try/catch). The server stores only the token row defined below. Never log request bodies.
2. **Never block, never judge.** No copy says "no deberías", "cuidado", "mal", or anything moral. The token is issued whether or not the user passes the comprehension question.
3. **No secrets in code.** All keys come from environment variables. Add `.env*` to `.gitignore` before the first commit. Provide `.env.example` with names only.
4. **Validate everything.** Zod schemas on every input and on every LLM output.
5. **Label AI.** Every AI-extracted value shows a small label "Extraído por IA — verifica". If the simulated fallback is used, show a visible banner "SALIDA DE IA SIMULADA".
6. **Invented data only.** Demo uses fictional lenders: "PagaYa", "Cuotix", "PrestaFácil". No real company logos.
7. **Free stack only.** Next.js (App Router, TypeScript) + Tailwind, Vercel Hobby, Supabase free, Gemini Flash free tier via `@google/generative-ai`, Recharts, Zod.
8. User-facing copy is in **Mexican Spanish**, short sentences, no jargon. Code and comments in English.

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only, used only for the aggregate RPC if needed
GEMINI_API_KEY=                 # server only
TOKEN_HMAC_SECRET=              # server only, 32+ random chars
USE_SIMULATED_AI=false          # true forces the mock extractor
```

## Feature 1 — Scaffold + Google sign-in
- Next.js + Tailwind + Supabase Auth with Google provider (`@supabase/ssr`).
- Pages: `/` (landing: one sentence + "Entrar con Google"), `/app` (protected), `/fondo` (funder view, protected).
- Persistent footer on every page: "¿Te amenazan por una deuda? CONDUSEF · Consejo Ciudadano 55 5533 5533".
- **Acceptance:** signed-out visit to `/app` redirects to `/`; sign-in returns to `/app` showing the user's first name; footer visible everywhere.
- **Commit:** `feat: scaffold, Google auth, protected routes, help footer`
- → **Deploy 1** to Vercel.

## Feature 2 — Upload form + validation
- `/app` step 1: "Sube capturas de tus apps de préstamos (máx. 3)".
- Client and server validation: 1–3 files, PNG/JPEG only, ≤4 MB each. Clear Spanish error messages.
- A visible note: "Tus capturas no se guardan. Se leen y se borran."
- **Acceptance:** PDF, 5 MB image, or 4 files are rejected on client and server.
- **Commit:** `feat: screenshot upload with validation`

## Feature 3 — Vision extraction + fallback
- Route handler `POST /api/extract` (Node runtime). Requires a valid Supabase session; otherwise 401.
- Sends images as base64 to Gemini Flash with a system prompt asking for **JSON only** matching:
  ```ts
  { loans: Array<{ lender: string; balance_mxn: number; next_payment_mxn: number | null;
    next_payment_date: string | null /* YYYY-MM-DD */; cat_percent: number | null }> ,
    notes: string }
  ```
  Instruct the model: never invent values; use null when not visible.
- Parse with Zod; clamp amounts to 0–1,000,000. On parse failure return `{ error: "manual" }`.
- If `USE_SIMULATED_AI=true` or Gemini errors/quota: return a fixed mock result for the three fictional lenders with `simulated: true`.
- Images are never persisted; no `console.log` of bodies.
- **Acceptance:** fictional screenshots return rows; malformed output triggers manual entry; simulated mode shows the banner.
- **Commit:** `feat: vision extraction with schema validation and labeled simulated fallback`

## Feature 4 — Review, peso math, incomplete notice (on device)
- Step 2: editable table of rows (user can fix any value, add a row manually, delete a row). Each AI value labeled.
- Save rows to `localStorage` only.
- Compute in the browser:
  - `total = Σ balance`
  - `quincena = Σ next_payment where date ≤ today + 15 days`
  - `yearlyCost ≈ Σ balance × cat/100` for rows with CAT; if any row lacks CAT, show "desconocido" for those.
- **Incomplete picture** if any row lacks CAT or date, or the user hasn't confirmed "Incluí todas mis apps". Show the yellow notice: "Puede faltar información. Este total podría ser mayor."
- Result screen matches the mockup: big "Debes $X en total", "en N apps", quincena card, yearly cost card, disclaimer "Cálculo aproximado — verifica con tu contrato".
- **Acceptance:** math verified with unit tests (Vitest) on 3 fixed cases, including one missing CAT; refreshing the page keeps rows; nothing about rows is sent to the server.
- **Commit:** `feat: on-device peso math, review table, incomplete-picture notice`

## Feature 5 — Comprehension question + signed token
- Before showing the total a second time, ask: "Sin ver arriba, ¿cuánto debes en total?" (numeric input, validated). Then reveal the total again.
- `comprehension_pass = |answer − total| ≤ 10% of total`.
- `POST /api/token` receives only: `{ picture_complete: boolean, comprehension_pass: boolean, loans_count: number }` — **never amounts**. Zod-validate; `loans_count` stored as 2, 3 or 4 (4 = 4+).
- Server computes `signature = HMAC-SHA256(TOKEN_HMAC_SECRET, user_id|issued_at|picture_complete|comprehension_pass|loans_count)` and inserts the row.
- Supabase migration (`supabase/migrations/001_tokens.sql`):
  ```sql
  create table public.tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    issued_at timestamptz not null default now(),
    picture_complete boolean not null,
    comprehension_pass boolean not null,
    loans_count smallint not null check (loans_count between 1 and 4),
    signature text not null
  );
  alter table public.tokens enable row level security;
  create policy "own select" on public.tokens for select using (auth.uid() = user_id);
  create policy "own insert" on public.tokens for insert with check (auth.uid() = user_id);
  -- no update, no delete policies

  create or replace function public.token_aggregates()
  returns table (sessions bigint, pct_complete numeric, pct_comprehension numeric)
  language sql security definer set search_path = public as $$
    select count(*),
           round(100.0 * avg(picture_complete::int), 1),
           round(100.0 * avg(comprehension_pass::int), 1)
    from public.tokens;
  $$;
  revoke all on function public.token_aggregates() from public;
  grant execute on function public.token_aggregates() to authenticated;
  ```
- Screen after token: "Listo. Ya viste tu panorama completo." + token id short code. Same message whether pass or fail.
- **Acceptance:** token row contains no amounts or lender names; user B cannot read user A's tokens (test with two Google accounts); pass and fail both get a token.
- **Commit:** `feat: comprehension check and HMAC-signed token with RLS`

## Feature 6 — Funder view (`/fondo`)
- Banner: "Vista del evaluador — solo datos agregados. Supuestos editables son estimaciones."
- Calls `token_aggregates()` only. Shows: sessions, % complete picture, % comprehension.
- Editable inputs (defaults): cost per gated user MX$200; levy pool MX$300,000,000; lender revenue base MX$6,811,000,000.
- Computes and charts (Recharts):
  - cost per comprehended user = cost ÷ (comprehension% / 100)
  - users fundable = pool ÷ cost per comprehended user
  - required levy rate = (users target × cost per comprehended user) ÷ revenue base
- Sunset banner: "Sunset a 12 meses: sin desviación medible, el proyecto se detiene o se rediseña."
- If sessions < 10, show "Muestra insuficiente" instead of percentages.
- **Acceptance:** changing any assumption updates numbers instantly; no individual row is ever fetched.
- **Commit:** `feat: funder view with aggregate metrics and levy math`
- → **Deploy 2.**

## Stretch (only if time) — Self-set brake
- "Poner mi freno": user chooses a cooldown (24 h, 72 h, 7 días). Stored only in `localStorage`. Lifting it waits for the cooldown. No server call.
- **Commit:** `feat: on-device self-set brake`

## Every session ends with
- Update `DECISIONS.md` (decision, why, date) and note tomorrow's first move.
- Commit and push.

## Final check before each deploy
- `git grep -i -E "key|secret"` shows no real values.
- RLS enabled on `tokens` (Supabase dashboard).
- No `console.log` of request bodies.
