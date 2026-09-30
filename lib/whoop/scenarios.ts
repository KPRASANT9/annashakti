import { buildDemoBiomarkers } from "./demo";
import type { RuntimeBiomarkers } from "./types";

export type WorkloadScenarioId =
  | "high_strain_ok_recovery"
  | "under_load"
  | "poor_sleep"
  | "low_recovery"
  | "balanced_wellbeing"
  | "mixed_selective";

export type WorkloadScenario = {
  id: WorkloadScenarioId;
  label: string;
  intent: string;
  biomarkers: RuntimeBiomarkers;
};

function withScores(
  base: RuntimeBiomarkers,
  patch: {
    recovery?: number;
    hrv?: number;
    rhr?: number;
    strain?: number;
    sleep?: number;
    rem?: number;
    sws?: number;
  },
): RuntimeBiomarkers {
  return {
    ...base,
    capturedAt: new Date().toISOString(),
    source: "whoop_demo",
    recovery: {
      ...base.recovery,
      score: patch.recovery ?? base.recovery.score,
      hrvRmssdMilli: patch.hrv ?? base.recovery.hrvRmssdMilli,
      restingHeartRate: patch.rhr ?? base.recovery.restingHeartRate,
    },
    cycle: {
      ...base.cycle,
      strain: patch.strain ?? base.cycle.strain,
    },
    sleep: {
      ...base.sleep,
      performancePercent: patch.sleep ?? base.sleep.performancePercent,
      remHours: patch.rem ?? base.sleep.remHours,
      slowWaveHours: patch.sws ?? base.sleep.slowWaveHours,
    },
  };
}

/** Lab workload scenarios for well-being × strain cybernetic validation. */
export function workloadScenarios(): WorkloadScenario[] {
  const base = buildDemoBiomarkers();
  return [
    {
      id: "under_load",
      label: "Under load — recovery lagging strain",
      intent: "High workload, low well-being capacity",
      biomarkers: withScores(base, {
        recovery: 42,
        hrv: 32,
        rhr: 64,
        strain: 16.5,
        sleep: 68,
        rem: 1.0,
        sws: 1.0,
      }),
    },
    {
      id: "high_strain_ok_recovery",
      label: "High strain with usable recovery",
      intent: "Hard day but body still has capacity — fuel & rebuild",
      biomarkers: withScores(base, {
        recovery: 72,
        hrv: 55,
        rhr: 52,
        strain: 15.8,
        sleep: 86,
        rem: 1.7,
        sws: 1.6,
      }),
    },
    {
      id: "poor_sleep",
      label: "Poor sleep — well-being debt",
      intent: "Sleep architecture failed; protect evening plate",
      biomarkers: withScores(base, {
        recovery: 61,
        hrv: 40,
        strain: 9.5,
        sleep: 58,
        rem: 0.8,
        sws: 0.9,
      }),
    },
    {
      id: "low_recovery",
      label: "Low recovery — repair mode",
      intent: "Well-being suppressed; reduce heroic load nutrition",
      biomarkers: withScores(base, {
        recovery: 48,
        hrv: 35,
        rhr: 62,
        strain: 8.2,
        sleep: 74,
      }),
    },
    {
      id: "balanced_wellbeing",
      label: "Balanced well-being",
      intent: "Capacity available — steady plate",
      biomarkers: withScores(base, {
        recovery: 78,
        hrv: 62,
        rhr: 50,
        strain: 8.5,
        sleep: 90,
        rem: 1.8,
        sws: 1.7,
      }),
    },
    {
      id: "mixed_selective",
      label: "Mixed — selective nourishment",
      intent: "Moderate strain + middling recovery",
      biomarkers: withScores(base, {
        recovery: 58,
        hrv: 42,
        rhr: 58,
        strain: 12.5,
        sleep: 78,
      }),
    },
  ];
}
