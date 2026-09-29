/**
 * Probabilistic composition assessment.
 * Run: npx tsx scripts/validate-compose.ts
 */
import { composeProbabilistic } from "../lib/synthesis/probabilistic";
import { buildDemoBiomarkers } from "../lib/whoop/demo";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const biomarkers = buildDemoBiomarkers();
const result = composeProbabilistic({
  biomarkers,
  at: new Date("2026-09-24T16:00:00"),
  seed: 42,
  samples: 32,
});

assert(result.foundations.length === 19, "all nutrient foundations");
assert(
  Math.abs(result.foundations.reduce((s, f) => s + f.posterior, 0) - 1) < 0.02,
  "posterior sums ~1",
);
assert(result.composition.length === 4, "plate has 4 elements");
assert(result.precision.precisionScore > 0, "precision scored");

const icmrMass = result.foundations
  .filter((f) => f.governingBody === "ICMR-NIN")
  .reduce((s, f) => s + f.posterior, 0);
assert(icmrMass > 0.5, "ICMR-NIN dominates posterior");

const top = result.foundations[0];
assert(top.ci95[0] <= top.posterior && top.posterior <= top.ci95[1], "CI contains mean");

console.log(
  JSON.stringify(
    {
      ok: true,
      method: result.method,
      precision: result.precision,
      topFoundations: result.foundations.slice(0, 5).map((f) => ({
        name: f.name,
        posterior: Number(f.posterior.toFixed(3)),
        evidence: f.evidenceSupport,
        authority: f.governingBody,
      })),
      plate: result.composition.map((c) => ({
        food: c.foodName,
        grams: c.grams,
        p: Number(c.selectionProbability.toFixed(3)),
      })),
      grounded: result.precision.passesGrounding,
    },
    null,
    2,
  ),
);
