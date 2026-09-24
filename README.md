# Annashakti

Putting the Indian body back together. The plate that trains with you.

The **kitchen homepage** (`/`) is the original six-beat Annashakti site — kept intact.
Tech surfaces for WHOOP synthesis and probabilistic composition live under `/lab`, `/whoop`, and `/science`.

## Surfaces

| Path | What |
|------|------|
| `/` | Original kitchen homepage (Achieve → Enter) |
| `/kitchen` | Kitchen book |
| `/lab` | WHOOP synthesis + Bayesian/frontier plate composition |
| `/whoop` | Runtime biomarker bundle |
| `/science` | Domains, evidence grades, ICMR-NIN anchors |

## Probabilistic + frontier composition

1. **Priors** — ICMR-NIN / NIH-ODS / WHO-FAO nutrient foundations  
2. **Likelihood** — WHOOP biomarker deficits × science-link evidence (A–D temper)  
3. **Posterior** — Bayesian update with Dirichlet CI95  
4. **Compose** — softmax sampling of Indian kitchen foods; Monte Carlo picks high-coverage plate  
5. **Frontier (optional)** — OpenAI / Anthropic may *dictate* candidate foundations & plate JSON; output is re-grounded before precision is accepted  

```bash
# Local Bayesian (no API key required)
curl 'http://localhost:3000/api/compose?demo=1&frontier=0&seed=42'

# With frontier dictation when OPENAI_API_KEY or ANTHROPIC_API_KEY is set
curl 'http://localhost:3000/api/compose?demo=1'
```

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## WHOOP live mode

Set `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI` (see `.env.example`), then visit `/api/whoop/auth`.

## Assessment

```bash
npm run validate
```

## Food Tech north star

Guide food-vendor stakeholders on composition through a tech-based solution; keep organic supply alignment with governing bodies; integrate smart logistics timing; encode cybernetics that capture the nourishment ↔ biomarker feedback loop — starting with WHOOP as the live physiological signal.
