import { INDIAN_FOODS, NUTRIENT_TARGETS, type NutrientId } from "@/lib/nutrients/icmr";
import {
  DOMAIN_COPY,
  SCIENCE_LINKS,
  type BiomarkerNutrientLink,
  type EvidenceGrade,
  type ScienceDomain,
} from "@/lib/science/domains";
import type { RuntimeBiomarkers } from "@/lib/whoop/types";

export type LifecyclePhase =
  | "deep_recovery"
  | "morning_activation"
  | "midday_load"
  | "training_window"
  | "evening_wind_down"
  | "overnight_repair";

export interface LifecycleContext {
  phase: LifecyclePhase;
  localHour: number;
  label: string;
  nourishmentFocus: string;
}

export interface NutrientPriority {
  nutrientId: NutrientId;
  name: string;
  unit: string;
  rda: number;
  priority: number;
  governingBody: string;
  reason: string;
  foodSuggestions: string[];
}

export interface SynthesizedInsight {
  id: string;
  title: string;
  summary: string;
  domain: ScienceDomain;
  domainTitle: string;
  evidence: EvidenceGrade;
  biomarkerSignals: string[];
  nutrients: NutrientId[];
  mechanism: string;
  appliedGuidance: string;
  nutrientAuthority: string;
  literatureHint: string;
  linkId: string;
  /** 0–100 raw utility before validation. */
  signalStrength: number;
}

export interface ValidationResult {
  insightId: string;
  valueScore: number;
  passes: boolean;
  checks: Array<{ id: string; label: string; passed: boolean; detail: string }>;
  caveats: string[];
}

export interface SynthesisResult {
  generatedAt: string;
  lifecycle: LifecycleContext;
  biomarkers: RuntimeBiomarkers;
  loadState: {
    label: string;
    recoveryBand: "low" | "moderate" | "high";
    strainBand: "low" | "moderate" | "high";
    sleepBand: "low" | "moderate" | "high";
    clarityUnderLoad: number;
  };
  insights: SynthesizedInsight[];
  validations: ValidationResult[];
  nutrientPlan: NutrientPriority[];
  scienceCoverage: Record<ScienceDomain, number>;
  methodNotes: string[];
}

function band(
  value: number | null,
  lowMax: number,
  highMin: number,
  invert = false,
): "low" | "moderate" | "high" {
  if (value == null) return "moderate";
  if (!invert) {
    if (value < lowMax) return "low";
    if (value >= highMin) return "high";
    return "moderate";
  }
  if (value > highMin) return "low";
  if (value <= lowMax) return "high";
  return "moderate";
}

export function resolveLifecycle(date = new Date()): LifecycleContext {
  const localHour = date.getHours() + date.getMinutes() / 60;

  if (localHour < 5) {
    return {
      phase: "overnight_repair",
      localHour,
      label: "Overnight repair",
      nourishmentFocus:
        "Support slow-wave and REM consolidation; avoid late load nutrition.",
    };
  }
  if (localHour < 9) {
    return {
      phase: "morning_activation",
      localHour,
      label: "Morning activation",
      nourishmentFocus:
        "Break the fast with protein + micronutrients for cognitive clarity.",
    };
  }
  if (localHour < 13) {
    return {
      phase: "midday_load",
      localHour,
      label: "Midday load",
      nourishmentFocus:
        "Stabilize glucose and minerals while work/strain accumulates.",
    };
  }
  if (localHour < 17) {
    return {
      phase: "training_window",
      localHour,
      label: "Training / peak strain window",
      nourishmentFocus:
        "Fuel glycogen and electrolytes around physical or cognitive peaks.",
    };
  }
  if (localHour < 21) {
    return {
      phase: "evening_wind_down",
      localHour,
      label: "Evening wind-down",
      nourishmentFocus:
        "Shift toward tryptophan, magnesium, and anti-inflammatory patterns.",
    };
  }
  return {
    phase: "deep_recovery",
    localHour,
    label: "Deep recovery prelude",
    nourishmentFocus:
      "Light, sleep-architecture supportive intake; protect recovery score.",
  };
}

function biomarkerValue(
  b: RuntimeBiomarkers,
  key: BiomarkerNutrientLink["biomarker"],
): number | null {
  switch (key) {
    case "recovery_score":
      return b.recovery.score;
    case "hrv":
      return b.recovery.hrvRmssdMilli;
    case "resting_hr":
      return b.recovery.restingHeartRate;
    case "strain":
      return b.cycle.strain;
    case "sleep_performance":
      return b.sleep.performancePercent;
    case "slow_wave":
      return b.sleep.slowWaveHours;
    case "rem":
      return b.sleep.remHours;
    case "spo2":
      return b.recovery.spo2Percent;
    case "skin_temp":
      return b.recovery.skinTempCelsius;
    case "respiratory_rate":
      return b.sleep.respiratoryRate;
  }
}

/** Higher = more need for nutritional intervention on that biomarker. */
function deficitScore(
  key: BiomarkerNutrientLink["biomarker"],
  value: number | null,
): number {
  if (value == null) return 35;
  switch (key) {
    case "recovery_score":
      return clamp(100 - value, 0, 100);
    case "hrv":
      // Adult RMSSD rough bands; <45 suppressed under load for this demo profile
      return clamp((55 - value) * 2.2, 0, 100);
    case "resting_hr":
      return clamp((value - 50) * 3, 0, 100);
    case "strain":
      return clamp((value - 8) * 8, 0, 100);
    case "sleep_performance":
      return clamp(100 - value, 0, 100);
    case "slow_wave":
      return clamp((1.6 - value) * 50, 0, 100);
    case "rem":
      return clamp((1.6 - value) * 50, 0, 100);
    case "spo2":
      return clamp((97.5 - value) * 25, 0, 100);
    case "skin_temp":
      return clamp((value - 33) * 40, 0, 100);
    case "respiratory_rate":
      return clamp((value - 14) * 20, 0, 100);
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const EVIDENCE_WEIGHT: Record<EvidenceGrade, number> = {
  A: 1,
  B: 0.82,
  C: 0.55,
  D: 0.28,
};

const PHASE_BOOST: Partial<
  Record<LifecyclePhase, BiomarkerNutrientLink["biomarker"][]>
> = {
  morning_activation: ["recovery_score", "hrv", "resting_hr"],
  midday_load: ["strain", "hrv"],
  training_window: ["strain", "recovery_score"],
  evening_wind_down: ["sleep_performance", "rem", "slow_wave"],
  deep_recovery: ["sleep_performance", "slow_wave", "rem", "hrv"],
  overnight_repair: ["slow_wave", "rem", "respiratory_rate"],
};

function foodsFor(nutrients: NutrientId[]): string[] {
  const scores = new Map<string, number>();
  for (const food of INDIAN_FOODS) {
    let score = 0;
    for (const n of nutrients) {
      if (food.per100g[n]) score += 1;
    }
    if (score > 0) scores.set(food.name, score);
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);
}

export function validateInsight(
  insight: SynthesizedInsight,
  biomarkers: RuntimeBiomarkers,
  lifecycle: LifecycleContext,
): ValidationResult {
  const checks: ValidationResult["checks"] = [];
  const caveats: string[] = [];

  const evidenceOk = insight.evidence === "A" || insight.evidence === "B";
  checks.push({
    id: "evidence_floor",
    label: "Evidence floor",
    passed: insight.evidence !== "D" || insight.signalStrength < 50,
    detail:
      insight.evidence === "D"
        ? "Quantum/emerging claims cannot dominate the guidance stack."
        : `Evidence grade ${insight.evidence} accepted for ranked insight.`,
  });

  checks.push({
    id: "governing_body",
    label: "Governing-body nutrient anchor",
    passed: Boolean(insight.nutrientAuthority),
    detail: `Nutrient side anchored to ${insight.nutrientAuthority}.`,
  });

  const hasSignal = insight.biomarkerSignals.length > 0;
  checks.push({
    id: "biomarker_present",
    label: "Runtime biomarker present",
    passed: hasSignal && insight.signalStrength >= 25,
    detail: hasSignal
      ? `Signal strength ${insight.signalStrength.toFixed(0)}/100.`
      : "No measurable biomarker deficit for this link.",
  });

  const phaseRelevant =
    PHASE_BOOST[lifecycle.phase]?.some((b) =>
      insight.biomarkerSignals.some((s) => s.startsWith(b)),
    ) ?? true;
  checks.push({
    id: "lifecycle_fit",
    label: "Daily lifecycle fit",
    passed: phaseRelevant || insight.signalStrength >= 70,
    detail: phaseRelevant
      ? `Aligned with ${lifecycle.label}.`
      : "Off-phase but high deficit — retained with caveat.",
  });

  if (!phaseRelevant && insight.signalStrength >= 70) {
    caveats.push(
      `High deficit outside ${lifecycle.label}; schedule intake at the next fitting phase.`,
    );
  }

  if (insight.evidence === "C" || insight.evidence === "D") {
    caveats.push(
      "Emerging/theoretical mechanism — treat as hypothesis under observation, not prescription.",
    );
  }

  if (biomarkers.recovery.calibrating) {
    caveats.push("WHOOP still calibrating — recovery metrics may be unstable.");
  }

  if (
    insight.domain === "epigenetics" &&
    insight.signalStrength > 0
  ) {
    caveats.push(
      "Epigenetic nutrition operates over days–weeks; do not expect same-day HRV reversal.",
    );
  }

  if (insight.domain === "quantum_biology") {
    caveats.push(
      "Quantum biology framing is research-horizon only; real-world value rides on classical redox nutrition evidence.",
    );
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const base = (passedCount / checks.length) * 100;
  const weighted =
    base * 0.55 +
    insight.signalStrength * 0.3 * EVIDENCE_WEIGHT[insight.evidence] +
    (evidenceOk ? 15 : 5);

  const valueScore = clamp(weighted, 0, 100);
  const passes =
    valueScore >= 55 &&
    checks.filter((c) => c.id !== "lifecycle_fit").every((c) => c.passed);

  return {
    insightId: insight.id,
    valueScore: Math.round(valueScore),
    passes,
    checks,
    caveats,
  };
}

export function synthesizeNourishment(
  biomarkers: RuntimeBiomarkers,
  at = new Date(),
): SynthesisResult {
  const lifecycle = resolveLifecycle(at);
  const recoveryBand = band(biomarkers.recovery.score, 50, 67);
  const strainBand = band(biomarkers.cycle.strain, 10, 14);
  const sleepBand = band(biomarkers.sleep.performancePercent, 70, 85);

  const clarityUnderLoad = clamp(
    ((biomarkers.recovery.score ?? 50) * 0.45 +
      (biomarkers.recovery.hrvRmssdMilli ?? 40) * 0.35 +
      (biomarkers.sleep.performancePercent ?? 70) * 0.2) /
      1.1 -
      (biomarkers.cycle.strain ?? 10) * 1.8,
    0,
    100,
  );

  const loadLabel =
    recoveryBand === "low" && strainBand === "high"
      ? "Under load — recovery lagging strain"
      : recoveryBand === "high" && sleepBand === "high"
        ? "Balanced — capacity available"
        : "Mixed — selective nourishment needed";

  const insights: SynthesizedInsight[] = SCIENCE_LINKS.map((link) => {
    const value = biomarkerValue(biomarkers, link.biomarker);
    let signal = deficitScore(link.biomarker, value);
    if (PHASE_BOOST[lifecycle.phase]?.includes(link.biomarker)) {
      signal = clamp(signal * 1.15, 0, 100);
    }
    signal *= EVIDENCE_WEIGHT[link.evidence] / EVIDENCE_WEIGHT.B + 0.15;
    signal = clamp(signal, 0, 100);

    const displayValue =
      value == null ? "n/a" : Number.isInteger(value) ? `${value}` : value.toFixed(1);

    return {
      id: `insight-${link.id}`,
      title: `${DOMAIN_COPY[link.domain].title} → ${link.biomarker.replaceAll("_", " ")}`,
      summary: link.appliedOutcome,
      domain: link.domain,
      domainTitle: DOMAIN_COPY[link.domain].title,
      evidence: link.evidence,
      biomarkerSignals: [`${link.biomarker}=${displayValue}`],
      nutrients: link.nutrients,
      mechanism: link.mechanism,
      appliedGuidance: link.appliedOutcome,
      nutrientAuthority: link.nutrientAuthority,
      literatureHint: link.literatureHint,
      linkId: link.id,
      signalStrength: Math.round(signal),
    };
  })
    .sort((a, b) => b.signalStrength - a.signalStrength)
    .slice(0, 8);

  const validations = insights.map((i) =>
    validateInsight(i, biomarkers, lifecycle),
  );

  const nutrientScores = new Map<NutrientId, { score: number; reasons: string[] }>();
  for (const insight of insights) {
    const validation = validations.find((v) => v.insightId === insight.id)!;
    if (!validation.passes && insight.evidence === "D") continue;
    const weight =
      (insight.signalStrength / 100) *
      EVIDENCE_WEIGHT[insight.evidence] *
      (validation.valueScore / 100);
    for (const n of insight.nutrients) {
      const cur = nutrientScores.get(n) ?? { score: 0, reasons: [] };
      cur.score += weight;
      cur.reasons.push(insight.appliedGuidance);
      nutrientScores.set(n, cur);
    }
  }

  const nutrientPlan: NutrientPriority[] = [...nutrientScores.entries()]
    .map(([nutrientId, { score, reasons }]) => {
      const meta = NUTRIENT_TARGETS.find((n) => n.id === nutrientId)!;
      return {
        nutrientId,
        name: meta.name,
        unit: meta.unit,
        rda: meta.rda,
        priority: Math.round(clamp(score * 100, 0, 100)),
        governingBody: meta.governingBody,
        reason: reasons[0],
        foodSuggestions: [
          ...new Set([
            ...meta.indianFoodSources.slice(0, 2),
            ...foodsFor([nutrientId]),
          ]),
        ].slice(0, 4),
      };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10);

  const scienceCoverage = Object.fromEntries(
    (Object.keys(DOMAIN_COPY) as ScienceDomain[]).map((d) => [
      d,
      insights.filter((i) => i.domain === d).length,
    ]),
  ) as Record<ScienceDomain, number>;

  return {
    generatedAt: at.toISOString(),
    lifecycle,
    biomarkers,
    loadState: {
      label: loadLabel,
      recoveryBand,
      strainBand,
      sleepBand,
      clarityUnderLoad: Math.round(clarityUnderLoad),
    },
    insights,
    validations,
    nutrientPlan,
    scienceCoverage,
    methodNotes: [
      "Nutrient RDAs anchored primarily to ICMR-NIN adult moderate-activity references, with NIH-ODS / WHO-FAO where ICMR gaps exist.",
      "WHOOP biomarkers curated at runtime (recovery, HRV, RHR, strain, sleep stages, SpO2, skin temp, respiratory rate, workouts).",
      "Insights ranked by deficit × evidence weight × lifecycle phase; validation rejects quantum-horizon claims as primary guidance.",
      "Epigenetic and quantum-biology links are included for scientific completeness with explicit caveats and evidence grades C/D.",
      "This system guides kitchen-first experimentation — not medical diagnosis.",
    ],
  };
}
