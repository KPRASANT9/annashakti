/**
 * Lab validation: well-being × strain × cybernetic feedback-workload.
 * Run: npx tsx scripts/validate-cybernetics.ts
 */
import { synthesizeNourishment } from "../lib/synthesis/engine";
import { composeProbabilistic } from "../lib/synthesis/probabilistic";
import { resolvePattern, buildCookableThali } from "../lib/loop/patterns";
import { assessCybernetics } from "../lib/loop/cybernetics";
import { workloadScenarios } from "../lib/whoop/scenarios";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const evening = new Date("2026-09-30T20:00:00");
const rows: Array<Record<string, unknown>> = [];

for (const scenario of workloadScenarios()) {
  const synthesis = synthesizeNourishment(scenario.biomarkers, evening);
  const composition = composeProbabilistic({
    biomarkers: scenario.biomarkers,
    at: evening,
    seed: 42,
    samples: 16,
  });
  const pattern = resolvePattern({
    recovery: scenario.biomarkers.recovery.score,
    strain: scenario.biomarkers.cycle.strain,
    sleepPerformance: scenario.biomarkers.sleep.performancePercent,
  });
  const thali = buildCookableThali({
    date: "2026-09-30",
    recovery: scenario.biomarkers.recovery.score,
    strain: scenario.biomarkers.cycle.strain,
    sleepPerformance: scenario.biomarkers.sleep.performancePercent,
  });

  // Simulate cybernetic loop: if under load with low clarity, next day feedback=2
  const clarity = synthesis.loadState.clarityUnderLoad;
  const simulatedPriorClarity =
    clarity < 35 ? 2 : clarity > 60 ? 4 : 3;

  const cyber = assessCybernetics({
    biomarkers: scenario.biomarkers,
    previousClarity: simulatedPriorClarity,
    grounded: composition.precision.passesGrounding,
    precisionScore: composition.precision.precisionScore,
  });

  const passedInsights = synthesis.validations.filter((v) => v.passes).length;

  rows.push({
    scenario: scenario.id,
    label: scenario.label,
    recovery: scenario.biomarkers.recovery.score,
    strain: scenario.biomarkers.cycle.strain,
    sleep: scenario.biomarkers.sleep.performancePercent,
    clarityUnderLoad: clarity,
    workloadIndex: cyber.workloadIndex,
    wellbeingBand: cyber.wellbeingBand,
    strainHandling: cyber.strainHandling,
    pattern: pattern.id,
    thali: thali.headline,
    insightsPassed: `${passedInsights}/${synthesis.validations.length}`,
    plateGrounded: composition.precision.passesGrounding,
    precision: composition.precision.precisionScore,
    handlingScore: cyber.handlingScore,
    feedbackAdapted: cyber.feedbackAdjustment.adapted,
    cyberPasses: cyber.passes,
    failedChecks: cyber.checks.filter((c) => !c.passed).map((c) => c.id),
  });

  assert(pattern.id === thali.pattern.id, `${scenario.id} pattern mismatch`);
  assert(
    synthesis.loadState.clarityUnderLoad === cyber.clarityUnderLoad,
    `${scenario.id} clarity parity`,
  );
}

const allPass = rows.every((r) => r.cyberPasses === true);
const groundedCount = rows.filter((r) => r.plateGrounded === true).length;

// Explicit feedback-workload capture test
const underLoad = workloadScenarios().find((s) => s.id === "under_load")!;
const afterFog = assessCybernetics({
  biomarkers: underLoad.biomarkers,
  previousClarity: 1,
  grounded: true,
});
assert(afterFog.feedbackAdjustment.adapted, "low clarity must adapt");
assert(
  afterFog.patternId === "poor_sleep" ||
    afterFog.patternId === "low_recovery" ||
    afterFog.patternId === "mixed_load",
  "foggy prior day should not fuel max strain heroics",
);

const afterClear = assessCybernetics({
  biomarkers: underLoad.biomarkers,
  previousClarity: 5,
  grounded: true,
});
assert(afterClear.feedbackAdjustment.adapted, "high clarity noted");

// Fuel path must remain available when prior clarity is solid
const fueled = workloadScenarios().find(
  (s) => s.id === "high_strain_ok_recovery",
)!;
const fuelCyber = assessCybernetics({
  biomarkers: fueled.biomarkers,
  previousClarity: 4,
  grounded: true,
});
assert(
  fuelCyber.patternId === "high_strain",
  "usable recovery + high strain + clear prior → fuel pattern",
);
assert(
  fuelCyber.strainHandling === "fuel_the_load",
  "strain handling must be fuel_the_load",
);
assert(fuelCyber.passes, "fuel path cyber checks must pass");

console.log(
  JSON.stringify(
    {
      ok: allPass,
      summary: {
        scenarios: rows.length,
        cyberPass: rows.filter((r) => r.cyberPasses).length,
        platesGrounded: groundedCount,
        meanHandling: Math.round(
          rows.reduce((s, r) => s + (r.handlingScore as number), 0) /
            rows.length,
        ),
        meanClarity: Math.round(
          rows.reduce((s, r) => s + (r.clarityUnderLoad as number), 0) /
            rows.length,
        ),
      },
      feedbackLoop: {
        lowClarityPrior: {
          adapted: afterFog.feedbackAdjustment.adapted,
          pattern: afterFog.patternId,
          handling: afterFog.strainHandling,
          reason: afterFog.feedbackAdjustment.reason,
        },
        highClarityPrior: {
          adapted: afterClear.feedbackAdjustment.adapted,
          pattern: afterClear.patternId,
          reason: afterClear.feedbackAdjustment.reason,
        },
        fuelPathClearPrior: {
          pattern: fuelCyber.patternId,
          handling: fuelCyber.strainHandling,
          handlingScore: fuelCyber.handlingScore,
          passes: fuelCyber.passes,
        },
      },
      scenarios: rows,
    },
    null,
    2,
  ),
);

if (!allPass) {
  process.exitCode = 1;
}
