# Deploy + WHOOP go-live

Site: https://annashakti.vercel.app  
Vercel project: endeavour6 / annashakti

## Current diagnosis (probed)

Production and PR previews are publishing the **git tree as static files**, not a Next.js build.

| Signal | Observation |
| --- | --- |
| `/` | 200 kitchen HTML |
| `/lab`, `/thali`, `/api/*` | 404 `NOT_FOUND` (plain text) |
| `/_next/static` | 404 |
| `/app/layout.tsx` | 200 (source on CDN) |
| Local `npm run build` | Emits `/lab`, `/api/whoop/*`, `/api/cybernetics`, … |

`vercel.json` already says `"framework": "nextjs"`. The **dashboard Framework Preset / Output Directory** is overriding it. Merging PRs alone will not fix this.

---

## Phase 0 — Unblock Next.js (owner, required)

Vercel → **annashakti** → **Settings → Build and Deployment**:

1. Framework Preset: **Next.js**
2. Build Command: override **off** (or `next build`)
3. Output Directory: override **off**, field **empty**
4. Install Command: override **off** (or `npm install`)
5. Root Directory: **blank**
6. Node.js: **20.x** or **22.x**
7. Ignored Build Step: **Automatic**
8. **Deployments → Redeploy** with **Use existing Build Cache = off**

### Pass gate

```bash
BASE=https://annashakti.vercel.app
curl -sI "$BASE/lab" | head -5          # 200 text/html
curl -s "$BASE/api/whoop/status"        # JSON, not NOT_FOUND
curl -sI "$BASE/app/layout.tsx" | head -3  # should be 404
curl -sI "$BASE/home.html" | head -3       # 200 (public/ mounted)
```

Kitchen homepage stays: `next.config.mjs` rewrites `/` → `/home.html`.

---

## Phase 1 — Demo path (no WHOOP secrets)

After Phase 0, with no WHOOP env vars:

| Check | Expect |
| --- | --- |
| `/lab` `/thali` `/loop` `/whoop` `/science` | 200 |
| `/api/synthesize?demo=1` | `ok:true`, `mode:"demo"` |
| `/api/compose?demo=1&frontier=0&seed=42` | grounded plate |
| `/api/whoop/status` | `configured:false`, `mode:"demo"` |
| `/api/whoop/auth` | 400 (not configured — expected) |
| Browser: Accept plate → `/loop` cook → clarity | works in localStorage |

`/api/cybernetics` is **404 on master** until PR #2 merges; test it on the PR preview after Phase 0 redeploy.

Smoke script: `scripts/smoke-endpoints.sh https://annashakti.vercel.app`

---

## Phase 2 — WHOOP live

### WHOOP Developer Portal (https://developer.whoop.com)

1. Create app; copy **Client ID** + **Client Secret**
2. Scopes: `offline read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement`
3. Redirect URI (exact): `https://annashakti.vercel.app/api/whoop/callback`
4. Optional local: `http://localhost:3000/api/whoop/callback`

### Vercel Production env (paste these four, then redeploy)

```text
WHOOP_CLIENT_ID=<from portal>
WHOOP_CLIENT_SECRET=<from portal>
WHOOP_REDIRECT_URI=https://annashakti.vercel.app/api/whoop/callback
NEXT_PUBLIC_APP_URL=https://annashakti.vercel.app
```

Leave unset: `WHOOP_MODE`, `WHOOP_ACCESS_TOKEN` (unless short debug).

### 10-minute human test

1. `GET /api/whoop/status` → `configured:true`, `connected:false`, `mode:"live"`
2. `/lab` → **Connect WHOOP** → consent
3. Land on `/lab?whoop=connected`
4. Uncheck Demo fixtures → status `connected=true`
5. `/api/whoop/metrics` → `source:"whoop_live"`
6. `/whoop` matches the WHOOP app
7. Disconnect → `connected:false`

---

## Phase 3 — Ship cybernetics (PR #2)

1. After Phase 0, redeploy preview of `cursor/cybernetics-lab-iteration-23f3`
2. `GET /api/cybernetics` → suite green, 6/6
3. Mark PR ready → merge to production branch (`master` / `main` — confirm which Vercel uses)
4. Alias smoke includes `/api/cybernetics`

---

## Phase 4 — Optional kitchen backend

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon mirror for enroll / loop / kitchen-feedback |
| `RESEND_API_KEY` + `RESEND_FROM` | enroll email |
| `KITCHEN_KEY` | kitchen phrase (default `first-hundred`) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | frontier compose (optional) |

Loop and lab work without these.

---

## Endpoint inventory

| Endpoint | Today (prod) | After Phase 0–1 | After Phase 2 | After Phase 3 |
| --- | --- | --- | --- | --- |
| `GET /` | 200 kitchen | 200 kitchen (rewrite) | same | same |
| `GET /kitchen` | 404 | 200 | same | same |
| `GET /lab` | 404 | 200 | same | + cyber panel |
| `GET /loop` | 404 | 200 | same | same |
| `GET /thali` | 404 | 200 | same | same |
| `GET /whoop` | 404 | 200 | live metrics | same |
| `GET /science` | 404 | 200 | same | same |
| `GET /api/whoop/status` | 404 | demo JSON | live configured | same |
| `GET /api/whoop/auth` | 404 | 400 | 302 → WHOOP | same |
| `GET /api/whoop/callback` | 404 | error redirect | `?whoop=connected` | same |
| `GET /api/whoop/metrics` | 404 | demo | live | same |
| `POST /api/whoop/disconnect` | 404 | 200 | clears cookies | same |
| `GET /api/synthesize` | 404 | demo/live | live if connected | same |
| `GET /api/compose` | 404 | grounded | same | same |
| `GET /api/cybernetics` | 404 | 404 on master | 404 | **200** suite |
| `GET/POST /api/loop` | 404 | localStorage | same | + neon if DB |
| `POST /api/enroll` | 404 | `stored:false` | same | neon/mail |
| `GET/POST /api/kitchen-feedback` | 404 | local | same | neon |
| `POST /api/kitchen` | 404 | phrase gate | same | tables if DB |

---

## Owner vs agent

| Action | Who |
| --- | --- |
| Flip Vercel Framework Preset / clear Output Directory / redeploy no-cache | **You** |
| Paste WHOOP + `NEXT_PUBLIC_APP_URL` on Vercel | **You** |
| Create WHOOP app + redirect URI | **You** |
| Complete browser OAuth consent | **You** |
| Mark PR #2 ready / merge | **You** |
| Smoke curls, validate scripts, code fixes | Agent |
| X Chat / Grok conversation ops for kitchen feedback | Needs X plugin reconnect with `dm.read` / `dm.write` |
