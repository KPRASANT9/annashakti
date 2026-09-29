/**
 * Headless assessment of synthesis + validation (no browser).
 * Run: npx tsx scripts/validate-synthesis.ts
 */
import { synthesizeNourishment } from "../lib/synthesis/engine";
import { buildDemoBiomarkers } from "../lib/whoop/demo";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const biomarkers = buildDemoBiomarkers();
const morning = synthesizeNourishment(biomarkers, new Date("2026-09-24T07:00:00"));
const evening = synthesizeNourishment(biomarkers, new Date("2026-09-24T20:00:00"));

assert(morning.insights.length >= 5, "expected insights");
assert(morning.validations.length === morning.insights.length, "validation parity");
assert(morning.nutrientPlan.length > 0, "nutrient plan");
assert(
  morning.lifecycle.phase === "morning_activation",
  `expected morning_activation got ${morning.lifecycle.phase}`,
);
assert(
  evening.lifecycle.phase === "evening_wind_down",
  `expected evening_wind_down got ${evening.lifecycle.phase}`,
);

const passed = morning.validations.filter((v) => v.passes);
const held = morning.validations.filter((v) => !v.passes);

assert(passed.length >= 3, "expected several value-passing insights under load demo");

const quantum = morning.insights.find((i) => i.domain === "quantum_biology");
if (quantum) {
  const v = morning.validations.find((x) => x.insightId === quantum.id)!;
  assert(
    v.caveats.some((c) => c.toLowerCase().includes("quantum")),
    "quantum insights must carry caveats",
  );
}

const hasIcMR = morning.nutrientPlan.some(
  (n) => n.governingBody === "ICMR-NIN" || n.governingBody.includes("ICMR"),
);
assert(hasIcMR, "nutrient plan should include ICMR-NIN anchors");

const clarity = morning.loadState.clarityUnderLoad;
assert(clarity >= 0 && clarity <= 100, "clarity band");

console.log(
  JSON.stringify(
    {
      ok: true,
      morningPhase: morning.lifecycle.phase,
      eveningPhase: evening.lifecycle.phase,
      load: morning.loadState.label,
      clarityUnderLoad: clarity,
      insights: morning.insights.length,
      passed: passed.length,
      held: held.length,
      topNutrients: morning.nutrientPlan.slice(0, 5).map((n) => ({
        name: n.name,
        priority: n.priority,
        body: n.governingBody,
      })),
      topValidated: passed
        .sort((a, b) => b.valueScore - a.valueScore)
        .slice(0, 3)
        .map((v) => {
          const insight = morning.insights.find((i) => i.id === v.insightId)!;
          return {
            title: insight.title,
            evidence: insight.evidence,
            valueScore: v.valueScore,
          };
        }),
    },
    null,
    2,
  ),
);
