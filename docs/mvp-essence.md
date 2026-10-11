# Annashakti — essence of all PRs & core workable MVP

**Pitch:** Annashakti turns today’s strain, sleep, and recovery into one Hyderabad thali you can cook tonight, log, and hand to a second kitchen.

`main` and `master` are identical at `3fe5835`. The cook-facing MVP is **already on `main`**. Users cannot reach it until Vercel runs Next.js (see `docs/deploy-go-live.md`).

---

## All PRs (GitHub)

| PR | Status | Essence |
| --- | --- | --- |
| **[#1](https://github.com/KPRASANT9/annashakti/pull/1)** WHOOP + nourishment synthesis | **Merged** into `main` | Foundation: kitchen face `/`, synthesis lab `/lab`, WHOOP OAuth + metrics `/whoop`, science `/science`, Bayesian/ICMR compose, demo biomarkers |
| **[#2](https://github.com/KPRASANT9/annashakti/pull/2)** Cybernetic lab + accuracy plan | **Open draft** | Lab/infra: workload scenarios, `/api/cybernetics`, feedback-workload assessor, iteration modeling plan, deploy smoke script — **not cook-facing** |

No other open PRs. MVP Slices A–C landed on `main` as direct commits after PR #1 (no separate PR numbers).

---

## Work that landed on `main` after PR #1 (no open PR)

| Slice / fix | Essence for users |
| --- | --- |
| **Deploy fixes** | Kitchen stays public face; Next.js forced in `vercel.json`; `/` → `home.html` rewrite |
| **Slice A** | Accept grounded plate → `/loop` → “I cooked this” → next-day clarity (1–5) |
| **Slice B** | `/thali` — cookable plate in katori / roti / tsp language |
| **Slice C** | Share thali with a second kitchen; collect what confused them |
| **Share fixes** | Link still works if clipboard blocked; URL-safe tokens |

---

## Core workable MVP (merge target = already on `main`)

### Include — users access these

| Surface | Job |
| --- | --- |
| `/` | Kitchen homepage (first 100 kitchens) |
| `/lab` | Build / accept a grounded plate (demo OK) |
| `/thali` | Tonight’s cookable thali + share |
| `/loop` | Daily practice log (cook → clarity) |
| `/whoop` | Recovery / strain / sleep (demo until OAuth) |
| `/science` | Why the plate is grounded |
| APIs | `synthesize`, `compose`, `loop`, `whoop/*`, `kitchen-feedback` |

Demo mode is enough to ship and test. Live WHOOP is the same product with real biomarkers.

### Exclude from this MVP launch

| Item | Why hold |
| --- | --- |
| PR #2 cybernetics suite | Accuracy lab for builders, not cooks |
| Neon / Resend / frontier LLM keys | Optional; loop + thali work without them |

---

## Recommendation

1. **Do not block user MVP on PR #2.** Leave it draft until `/thali` and `/loop` are live 200s.
2. **No further git merge needed for MVP content** — promote what is already on `main`.
3. **Owner unlock:** Vercel Framework → Next.js, clear Output Directory, redeploy no-cache → then WHOOP env if testing live strap.
4. **After cooks can use the site:** merge PR #2 as the accuracy / cybernetic layer.

---

## User journey (workable MVP)

```text
Kitchen (/)  →  Lab: accept plate  →  Thali: cook / share
                      ↓
                 Loop: cooked? → clarity tomorrow
                      ↓
              (optional) Connect WHOOP for live body data
```

---

## Promote checklist

- [x] PR #1 merged
- [x] Slice A / B / C on `main`
- [ ] Vercel Next.js preset + no-cache redeploy
- [ ] Smoke: `/lab` `/thali` `/loop` return 200; `/api/whoop/status` JSON
- [ ] Demo day: accept → cook → clarity → share thali
- [ ] (Optional) WHOOP Production secrets + Connect test
- [ ] (Later) Mark PR #2 ready and merge for lab accuracy
