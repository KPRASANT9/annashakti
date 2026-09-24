# Annashakti

Precision nourishment for the Indian body under load — WHOOP biomarkers curated at runtime, synthesized with ICMR-NIN nutrient science, and validated before they guide the plate.

## What this builds

1. **WHOOP integration** — OAuth + token paths exposing recovery, HRV, RHR, SpO₂, skin temp, cycles/strain, sleep stages, workouts. Demo fixtures when credentials are absent.
2. **Scientific synthesis** — Biomarker ↔ nutrient links across molecular biology, neurocardiology, chronobiology, epigenetics, exercise physiology, and quantum biology (evidence-graded A–D).
3. **ICMR-NIN anchors** — Nutrient RDAs and Indian kitchen sources; NIH-ODS / WHO-FAO where needed.
4. **Validation gate** — Insights scored for evidence floor, governing-body anchor, runtime signal, and daily lifecycle fit.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:
- `/` — brand + thesis
- `/lab` — synthesis experiment + validation
- `/whoop` — full runtime metric bundle
- `/science` — domain links and nutrient anchors

## WHOOP live mode

1. Create an app at [developer.whoop.com](https://developer.whoop.com)
2. Set in `.env.local`:

```
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
WHOOP_REDIRECT_URI=http://localhost:3000/api/whoop/callback
WHOOP_MODE=live
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Visit `/api/whoop/auth` or use **Connect WHOOP** in the lab.

Alternatively set `WHOOP_ACCESS_TOKEN` for local experiments without the browser OAuth round-trip.

## Assessment script

```bash
npm run validate
```

## Food Tech north star

Guide food-vendor stakeholders on composition through a tech-based solution; keep organic supply alignment with governing bodies; integrate smart logistics timing; encode cybernetics that capture the nourishment ↔ biomarker feedback loop — starting with WHOOP as the live physiological signal.
