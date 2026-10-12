# Decisions log

## 2026-10-12

- **Scaffold**: Next.js (App Router, TypeScript, `src/` dir) + Tailwind, deployable to Vercel Hobby for free. Chosen per `docs/PACKET.md` stack table.
- **Auth**: Supabase Auth with the Google provider via `@supabase/ssr` (browser client, server client, and session-refresh proxy). `redirectTo` is built from `window.location.origin` at click time (`src/components/GoogleSignInButton.tsx`), not a hardcoded URL, so the same code works on `localhost` and on the Vercel deploy domain.
- **Next.js 16 migration**: the framework renamed the `middleware.ts` convention to `proxy.ts` (exported function `proxy` instead of `middleware`). Migrated immediately to avoid building on a deprecated API.
- **Cache Components**: disabled `cacheComponents` in `next.config.ts`. Every route in this app reads the Supabase session via cookies, so nothing can be statically prerendered — leaving the experimental caching mode on only produced build errors for no benefit here.
- **.gitignore**: kept the blanket `.env*` ignore rule but added `!.env.example` so the variable-name template is the one `.env*` file tracked in git. `.env.local` (real Supabase URL/anon key, HMAC secret) stays untracked and local-only.
- **Known issue — Safari on localhost**: Google sign-in works end-to-end in Chrome (redirects through `/auth/callback` to `/app`, shows the first name). In Safari, `localhost` sign-in leaves the page blank after the Google redirect. Not yet root-caused; likely candidates are Safari's Intelligent Tracking Prevention blocking the Supabase auth cookie on `localhost`, or the OAuth popup/redirect flow behaving differently in Safari's dev-mode cookie jar. **Not reproduced against the real Vercel deploy domain yet** — that's the first thing to check before assuming it's a real bug rather than a `localhost`-only quirk.

**Tomorrow's first move**: before starting Feature 2, verify whether the Safari blank-page issue also happens on the deployed Vercel URL (real HTTPS domain, no `localhost` cookie quirks). If it persists there, dig into the Supabase Auth cookie settings (`sameSite`, `secure`) for Safari specifically.
