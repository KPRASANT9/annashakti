# Annashakti

Putting the Indian body back together. The plate that trains with you.  
First 100 kitchens, Hyderabad.

The **kitchen homepage** (`/`) is the public face. Tech surfaces for WHOOP synthesis and probabilistic composition live under `/lab`, `/whoop`, and `/science`.

Production mail uses the verified domain sender.

## Surfaces

| Path | What |
|------|------|
| `/` | Kitchen homepage (Achieve → Enter) |
| `/kitchen` | Kitchen book |
| `/lab` | WHOOP synthesis + Bayesian/frontier plate composition |
| `/whoop` | Runtime biomarker bundle |
| `/science` | Domains, evidence grades, ICMR-NIN anchors |

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Probabilistic + frontier composition

1. **Priors** — ICMR-NIN / NIH-ODS / WHO-FAO  
2. **Likelihood** — WHOOP × evidence temper (A–D)  
3. **Posterior** — Bayesian update with CI95  
4. **Compose** — Indian kitchen foods via Monte Carlo  
5. **Frontier (optional)** — model proposes; grounding has the last word  

```bash
curl 'http://localhost:3000/api/compose?demo=1&frontier=0&seed=42'
npm run validate
```

## WHOOP live mode

Set `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI` (see `.env.example`), then visit `/api/whoop/auth`.
