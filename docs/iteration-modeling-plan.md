# Iteration modeling plan — accuracy of Annashakti

Goal: improve **decision accuracy** of the plate system (right pattern, grounded nutrients, honest uncertainty) by closing a measurable cybernetic loop: **WHOOP load → plate → cook → sleep → next-day clarity → adapted priors**.

This is not a calendar roadmap. It is a sequence of model iterations with acceptance metrics.

---

## Accuracy definition

| Layer | What “accurate” means | Primary metric |
| --- | --- | --- |
| A. Biomarker → load | Clarity / workload index match felt state | Correlation of `clarityUnderLoad` vs self-reported clarity (1–5) |
| B. Load → pattern | Strain / recovery / sleep map to correct thali pattern | Lab scenario pass rate (`strain_pattern_align`) |
| C. Pattern → plate | Composed foods meet ICMR priors + grounding gate | `% plates grounded`, precision score ≥ threshold |
| D. Feedback → adaptation | Prior clarity changes next plate when well-being failed | `% sessions where low clarity (≤2) triggers protect/settle` |
| E. Outcome | Cooked plate → better next-day clarity under similar strain | Δ clarity after matched strain days (with vs without accept+cook) |

Ship gate for each iteration: **lab scenario suite green** + **no regression on grounded rate**.

---

## Control variables (what we tune)

1. **Pattern thresholds** — sleep &lt; 70, recovery &lt; 55, strain ≥ 14 (`resolvePattern`).
2. **Clarity under load weights** — recovery / HRV / sleep / strain (`computeClarityUnderLoad`).
3. **Workload index mix** — strain vs capacity (`computeWorkloadIndex`).
4. **Feedback gain** — how hard prior clarity ≤2 pulls recovery/sleep (`applyClarityFeedback`).
5. **Bayesian temper** — evidence weights A–D, Monte Carlo samples, grounding checks.
6. **Lifecycle hour** — morning vs wind-down nutrient boosts.

Do **not** tune more than two control families per iteration.

---

## Iteration sequence

### I0 — Lab baseline (current)

- Workload scenarios: under load, high strain + recovery, poor sleep, low recovery, balanced, mixed.
- Cybernetic assessor + `scripts/validate-cybernetics.ts` + `GET /api/cybernetics`.
- **Acceptance:** all scenarios `cyber.passes`; feedback fog → protect/settle; plates grounded.

### I1 — Calibrate clarity ↔ self-report

- Collect Slice A loop rows: accepted plate, cooked?, next-day clarity, WHOOP snapshot.
- Fit a simple model: `reported_clarity ~ f(recovery, hrv, sleep, strain)`.
- Retune clarity weights only if |bias| on distressed/strained bands &gt; 0.5 points.
- **Acceptance:** mean absolute error (MAE) of mapped clarity band ≤ 0.75 on held-out loop days; lab suite still green.

### I2 — Pattern confusion matrix

- Build confusion matrix: predicted pattern vs cook-chosen / kitchen feedback preference.
- Adjust only thresholds that cause systematic swaps (e.g. high_strain vs mixed_load).
- **Acceptance:** diagonal ≥ 70% on days with cook confirmation; no drop in grounded rate.

### I3 — Feedback gain (cybernetic step size)

- Split days with prior clarity ≤2: half with current bias, half with softer/harder pull (A/B in lab + opt-in loop).
- Measure next-day clarity under comparable strain (±2 strain units).
- **Acceptance:** adapted arm shows higher mean next clarity **or** equal clarity with fewer “felt wrong plate” kitchen flags.

### I4 — Nutrient posterior sharpening

- Reweight evidence grades using rejection reasons from grounding checks + kitchen “not cookable” flags.
- Increase Monte Carlo samples only where coverage uncertainty dominates precision failures.
- **Acceptance:** grounded rate ↑ or flat; frontier-dictated plates do not regress ICMR coverage.

### I5 — Workload-conditional priors

- Condition nutrient priors on `workloadIndex` bands (low / mid / high) instead of one global prior.
- Keep ICMR RDA floors; only shift posterior mass among already-allowed foods.
- **Acceptance:** handling score mean ↑ on under_load + high_strain scenarios; balanced scenario unchanged ±5%.

### I6 — Outcome model (accuracy of the loop)

- Estimate P(clarity ≥ 4 | cooked, pattern, workload band) with hierarchical shrinkage (small-n safe).
- Surface in lab as “expected clarity lift” — never as medical claim.
- **Acceptance:** Brier score vs naive baseline improves on ≥30 loop completions; caveats remain visible.

---

## Lab harness (how we validate each iteration)

```text
WHOOP scenario fixtures  →  synthesize  →  compose  →  assessCybernetics
                              ↓                ↓              ↓
                         loadState      grounding gate   handlingScore
                              ↓
                     applyClarityFeedback (prior 1–5)
                              ↓
                     pattern + thali + pass/fail checks
```

Commands:

- `npx tsx scripts/validate-cybernetics.ts`
- `npm run validate` (synthesis + compose + thali + cybernetics)
- `GET /api/cybernetics` — all scenarios JSON
- `GET /api/cybernetics?scenario=under_load&priorClarity=2` — single feedback case

---

## Data needed (minimal)

| Field | Source |
| --- | --- |
| recovery, HRV, strain, sleep % | WHOOP live or demo |
| accepted plate + foods | Slice A accept |
| cooked boolean | Daily loop |
| next-day clarity 1–5 | Daily loop |
| kitchen flag / note | Slice C feedback |
| priorClarity used for adaptation | Stored with accept or derived |

No new PII stores. Aggregate metrics only for model reports.

---

## Anti-goals

- Optimizing for flashy frontier narrative over grounded ICMR coverage.
- Treating evidence D (quantum / speculative) as primary plate drivers.
- Changing kitchen homepage UX to chase lab metrics.
- Claiming medical diagnosis or recovery guarantees.

---

## Decision rule between iterations

1. Run lab suite → must stay green.
2. Compare primary metric for that iteration vs previous commit.
3. Keep change only if metric improves **and** no layer A–D regresses beyond agreed slack (grounded rate −2 pts, handling mean −5 pts).
4. Document the two knobs turned + before/after JSON from `/api/cybernetics` in the PR.
