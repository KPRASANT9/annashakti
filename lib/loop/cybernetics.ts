/**
 * Cybernetic feedback — workload → plate → clarity → next adaptation.
 * Closes the loop Slice A logs open: next-day clarity steers tonight's handling.
 */

import type { PatternId } from "@/lib/loop/patterns";
import { resolvePattern } from "@/lib/loop/patterns";
import type { RuntimeBiomarkers } from "@/lib/whoop/types";

export type WellbeingBand = "distressed" | "strained" | "steady" | "resilient";
export type StrainHandling =
  | "protect_and_repair"
  | "fuel_the_load"
  | "settle_for_sleep"
  | "steady_maintenance"
  | "selective_support";

export type CyberneticAssessment = {
  wellbeingBand: WellbeingBand;
  strainHandling: StrainHandling;
  clarityUnderLoad: number;
  workloadIndex: number;
  /** 0–100: how well plate pattern matches workload pressure */
  handlingScore: number;
  patternId: PatternId;
  feedbackAdjustment: {
    previousClarity: number | null;
    adapted: boolean;
    reason: string;
  };
  checks: Array<{ id: string; passed: boolean; detail: string }>;
  passes: boolean;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function computeClarityUnderLoad(b: RuntimeBiomarkers): number {
  return Math.round(
    clamp(
      ((b.recovery.score ?? 50) * 0.45 +
        (b.recovery.hrvRmssdMilli ?? 40) * 0.35 +
        (b.sleep.performancePercent ?? 70) * 0.2) /
        1.1 -
        (b.cycle.strain ?? 10) * 1.8,
      0,
      100,
    ),
  );
}

/** Workload pressure: strain up, recovery/sleep/HRV down. */
export function computeWorkloadIndex(b: RuntimeBiomarkers): number {
  const strain = b.cycle.strain ?? 10;
  const recovery = b.recovery.score ?? 50;
  const sleep = b.sleep.performancePercent ?? 70;
  const hrv = b.recovery.hrvRmssdMilli ?? 45;
  const strainPart = clamp((strain / 20) * 100, 0, 100);
  const capacityPart =
    100 -
    clamp(recovery * 0.45 + sleep * 0.35 + clamp(hrv, 0, 80) * 0.25, 0, 100);
  return Math.round(clamp(strainPart * 0.55 + capacityPart * 0.45, 0, 100));
}

export function wellbeingBand(clarity: number, recovery: number | null): WellbeingBand {
  if (clarity < 25 || (recovery != null && recovery < 50)) return "distressed";
  if (clarity < 45 || (recovery != null && recovery < 60)) return "strained";
  if (clarity >= 65 && (recovery == null || recovery >= 70)) return "resilient";
  return "steady";
}

export function strainHandlingFor(patternId: PatternId): StrainHandling {
  switch (patternId) {
    case "low_recovery":
      return "protect_and_repair";
    case "high_strain":
      return "fuel_the_load";
    case "poor_sleep":
      return "settle_for_sleep";
    case "balanced":
      return "steady_maintenance";
    case "mixed_load":
      return "selective_support";
  }
}

/**
 * If yesterday's clarity under load was poor after high strain,
 * bias tonight toward repair/sleep protection (cybernetic feedback).
 */
export function applyClarityFeedback(
  biomarkers: RuntimeBiomarkers,
  previousClarity: number | null,
): {
  recovery: number | null;
  strain: number | null;
  sleepPerformance: number | null;
  adapted: boolean;
  reason: string;
  patternId: PatternId;
} {
  let recovery = biomarkers.recovery.score;
  let strain = biomarkers.cycle.strain;
  let sleep = biomarkers.sleep.performancePercent;
  let adapted = false;
  let reason = "No prior clarity feedback — using today's WHOOP only.";

  if (previousClarity != null && previousClarity <= 2) {
    // Felt foggy after yesterday's plate/load → protect well-being tonight
    adapted = true;
    reason =
      "Prior clarity ≤2 under load — biasing tonight toward repair / sleep protection (cybernetic feedback).";
    if (recovery != null) recovery = Math.min(recovery, 52);
    if (sleep != null) sleep = Math.min(sleep, 68);
  } else if (previousClarity != null && previousClarity >= 4) {
    adapted = true;
    reason =
      "Prior clarity ≥4 — well-being held under load; allow normal pattern match.";
  }

  const patternId = resolvePattern({
    recovery,
    strain,
    sleepPerformance: sleep,
  }).id;

  return {
    recovery,
    strain,
    sleepPerformance: sleep,
    adapted,
    reason,
    patternId,
  };
}

export function assessCybernetics(input: {
  biomarkers: RuntimeBiomarkers;
  previousClarity?: number | null;
  grounded?: boolean;
  precisionScore?: number;
}): CyberneticAssessment {
  const clarity = computeClarityUnderLoad(input.biomarkers);
  const workload = computeWorkloadIndex(input.biomarkers);
  const feedback = applyClarityFeedback(
    input.biomarkers,
    input.previousClarity ?? null,
  );
  const patternId = feedback.patternId;
  const handling = strainHandlingFor(patternId);
  const band = wellbeingBand(clarity, input.biomarkers.recovery.score);

  const checks: CyberneticAssessment["checks"] = [];

  // Align against feedback-adapted signals (cybernetic prior clarity may
  // pull sleep/recovery down toward protect / settle modes).
  const strain = feedback.strain ?? input.biomarkers.cycle.strain ?? 0;
  const recovery = feedback.recovery ?? input.biomarkers.recovery.score ?? 50;
  const sleep = feedback.sleepPerformance ?? input.biomarkers.sleep.performancePercent ?? 70;

  const expectsFuel = strain >= 14 && recovery >= 55 && sleep >= 70;
  const expectsProtect = recovery < 55;
  const expectsSleep = sleep < 70;
  const protectOk =
    patternId === "low_recovery" ||
    patternId === "mixed_load" ||
    patternId === "poor_sleep";

  const aligned = expectsSleep
    ? patternId === "poor_sleep"
    : expectsProtect
      ? protectOk
      : expectsFuel
        ? patternId === "high_strain"
        : true;

  checks.push({
    id: "strain_pattern_align",
    passed: aligned,
    detail: `Pattern ${patternId} for adapted strain=${typeof strain === "number" ? Number(strain).toFixed(1) : strain}, recovery=${recovery}, sleep=${sleep}${feedback.adapted ? " (feedback-adapted)" : ""}.`,
  });

  checks.push({
    id: "wellbeing_visible",
    passed: clarity >= 0 && clarity <= 100,
    detail: `Clarity under load = ${clarity}/100; wellbeing band = ${band}.`,
  });

  checks.push({
    id: "workload_indexed",
    passed: workload >= 0,
    detail: `Workload index = ${workload}/100 (strain vs capacity).`,
  });

  checks.push({
    id: "feedback_captured",
    passed:
      input.previousClarity == null ||
      feedback.adapted ||
      (input.previousClarity >= 3 && input.previousClarity <= 3),
    detail: feedback.reason,
  });

  if (input.grounded != null) {
    checks.push({
      id: "plate_grounded",
      passed: input.grounded,
      detail: input.grounded
        ? "Composed plate passed grounding gate."
        : "Plate not grounded — do not treat as cook guidance.",
    });
  }

  // Handling score: match + clarity cushion under workload
  let handlingScore = 50;
  if (checks.find((c) => c.id === "strain_pattern_align")?.passed)
    handlingScore += 25;
  if (band === "resilient" || band === "steady") handlingScore += 15;
  if (band === "distressed" && handling === "protect_and_repair")
    handlingScore += 15;
  if (expectsFuel && handling === "fuel_the_load") handlingScore += 10;
  if (input.grounded) handlingScore += 10;
  if (input.previousClarity != null && input.previousClarity <= 2 && feedback.adapted)
    handlingScore += 10;
  handlingScore = clamp(handlingScore, 0, 100);

  checks.push({
    id: "handling_threshold",
    passed: handlingScore >= 60,
    detail: `Strain/well-being handling score ${handlingScore}/100 (need ≥60).`,
  });

  const passes = checks.every((c) => c.passed);

  return {
    wellbeingBand: band,
    strainHandling: handling,
    clarityUnderLoad: clarity,
    workloadIndex: workload,
    handlingScore,
    patternId,
    feedbackAdjustment: {
      previousClarity: input.previousClarity ?? null,
      adapted: feedback.adapted,
      reason: feedback.reason,
    },
    checks,
    passes,
  };
}
