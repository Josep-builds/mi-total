# Decisions log

## 2026-10-12

- **Scaffold**: Next.js (App Router, TypeScript, `src/` dir) + Tailwind, deployable to Vercel Hobby for free. Chosen per `docs/PACKET.md` stack table.
- **Auth**: Supabase Auth with the Google provider via `@supabase/ssr` (browser client, server client, and session-refresh proxy). `redirectTo` is built from `window.location.origin` at click time (`src/components/GoogleSignInButton.tsx`), not a hardcoded URL, so the same code works on `localhost` and on the Vercel deploy domain.
- **Next.js 16 migration**: the framework renamed the `middleware.ts` convention to `proxy.ts` (exported function `proxy` instead of `middleware`). Migrated immediately to avoid building on a deprecated API.
- **Cache Components**: disabled `cacheComponents` in `next.config.ts`. Every route in this app reads the Supabase session via cookies, so nothing can be statically prerendered — leaving the experimental caching mode on only produced build errors for no benefit here.
- **.gitignore**: kept the blanket `.env*` ignore rule but added `!.env.example` so the variable-name template is the one `.env*` file tracked in git. `.env.local` (real Supabase URL/anon key, HMAC secret) stays untracked and local-only.
- **Known issue — Safari on localhost**: Google sign-in works end-to-end in Chrome (redirects through `/auth/callback` to `/app`, shows the first name). In Safari, `localhost` sign-in leaves the page blank after the Google redirect. Not yet root-caused; likely candidates are Safari's Intelligent Tracking Prevention blocking the Supabase auth cookie on `localhost`, or the OAuth popup/redirect flow behaving differently in Safari's dev-mode cookie jar.
- **Deploy 1**: live at **https://mi-total.vercel.app**. Confirmed Google sign-in works end-to-end there in both Safari and Chrome — the earlier blank-page issue is specific to Safari + `localhost` (cookie/ITP behavior), not a bug in the auth flow itself. No further action needed on the real domain; revisit only if it resurfaces for local dev testing in Safari.

**Tomorrow's first move**: start Feature 2 (upload form + validation) per `IMPLEMENTATION_PROMPT.md`.
