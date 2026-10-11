import { NextRequest, NextResponse } from "next/server";
import { assessCybernetics } from "@/lib/loop/cybernetics";
import { buildCookableThali, resolvePattern } from "@/lib/loop/patterns";
import { composeProbabilistic } from "@/lib/synthesis/probabilistic";
import { synthesizeNourishment } from "@/lib/synthesis/engine";
import { ingestRuntimeBiomarkers } from "@/lib/whoop/client";
import { buildDemoBiomarkers } from "@/lib/whoop/demo";
import {
  workloadScenarios,
  type WorkloadScenarioId,
} from "@/lib/whoop/scenarios";
import type { RuntimeBiomarkers } from "@/lib/whoop/types";

/**
 * Lab endpoint: well-being × strain × cybernetic feedback-workload.
 * GET ?scenario=under_load&priorClarity=2&demo=1
 * GET ?demo=1  — runs all workload scenarios
 */
export async function GET(req: NextRequest) {
  const forceDemo = req.nextUrl.searchParams.get("demo") !== "0";
  const scenarioId = req.nextUrl.searchParams.get(
    "scenario",
  ) as WorkloadScenarioId | null;
  const priorParam = req.nextUrl.searchParams.get("priorClarity");
  const previousClarity =
    priorParam != null && priorParam !== ""
      ? Number(priorParam)
      : null;
  const hourParam = req.nextUrl.searchParams.get("hour");

  const at = new Date();
  if (hourParam != null && hourParam !== "") {
    const hour = Number(hourParam);
    if (!Number.isNaN(hour) && hour >= 0 && hour < 24) {
      at.setHours(hour, 0, 0, 0);
    }
  }

  const scenarios = workloadScenarios();

  if (!scenarioId) {
    const rows = scenarios.map((s) => {
      const synthesis = synthesizeNourishment(s.biomarkers, at);
      const composition = composeProbabilistic({
        biomarkers: s.biomarkers,
        at,
        seed: 42,
        samples: 16,
      });
      const clarity = synthesis.loadState.clarityUnderLoad;
      const prior =
        previousClarity != null && !Number.isNaN(previousClarity)
          ? previousClarity
          : clarity < 35
            ? 2
            : clarity > 60
              ? 4
              : 3;
      const cyber = assessCybernetics({
        biomarkers: s.biomarkers,
        previousClarity: prior,
        grounded: composition.precision.passesGrounding,
        precisionScore: composition.precision.precisionScore,
      });
      const pattern = resolvePattern({
        recovery: s.biomarkers.recovery.score,
        strain: s.biomarkers.cycle.strain,
        sleepPerformance: s.biomarkers.sleep.performancePercent,
      });
      return {
        scenario: s.id,
        label: s.label,
        intent: s.intent,
        priorClarity: prior,
        cyber,
        pattern: pattern.id,
        plateGrounded: composition.precision.passesGrounding,
        precisionScore: composition.precision.precisionScore,
        clarityUnderLoad: clarity,
      };
    });

    return NextResponse.json({
      ok: rows.every((r) => r.cyber.passes),
      mode: "lab_scenarios",
      summary: {
        scenarios: rows.length,
        cyberPass: rows.filter((r) => r.cyber.passes).length,
        platesGrounded: rows.filter((r) => r.plateGrounded).length,
        meanHandling: Math.round(
          rows.reduce((s, r) => s + r.cyber.handlingScore, 0) / rows.length,
        ),
      },
      scenarios: rows,
    });
  }

  const scenario = scenarios.find((s) => s.id === scenarioId);
  let biomarkers: RuntimeBiomarkers;
  let mode: "demo" | "live" | "scenario" = "scenario";
  let connected = false;

  if (scenario) {
    biomarkers = scenario.biomarkers;
  } else if (forceDemo) {
    biomarkers = buildDemoBiomarkers();
    mode = "demo";
  } else {
    const ingested = await ingestRuntimeBiomarkers();
    biomarkers = ingested.biomarkers;
    connected = ingested.connected;
    mode = ingested.mode;
  }

  const synthesis = synthesizeNourishment(biomarkers, at);
  const composition = composeProbabilistic({
    biomarkers,
    at,
    seed: 42,
    samples: 16,
  });
  const prior =
    previousClarity != null && !Number.isNaN(previousClarity)
      ? previousClarity
      : null;
  const cyber = assessCybernetics({
    biomarkers,
    previousClarity: prior,
    grounded: composition.precision.passesGrounding,
    precisionScore: composition.precision.precisionScore,
  });
  const thali = buildCookableThali({
    date: at.toISOString().slice(0, 10),
    recovery: biomarkers.recovery.score,
    strain: biomarkers.cycle.strain,
    sleepPerformance: biomarkers.sleep.performancePercent,
    patternId: cyber.patternId,
    loadLabel: synthesis.loadState.label,
  });

  return NextResponse.json({
    ok: cyber.passes,
    mode,
    connected,
    scenario: scenario?.id ?? null,
    label: scenario?.label ?? null,
    priorClarity: prior,
    cyber,
    thali: {
      headline: thali.headline,
      whyTonight: thali.whyTonight,
      patternId: thali.pattern.id,
      items: thali.items.map((i) => ({ name: i.name, amount: i.amount })),
    },
    synthesis: {
      clarityUnderLoad: synthesis.loadState.clarityUnderLoad,
      loadLabel: synthesis.loadState.label,
    },
    composition: {
      precisionScore: composition.precision.precisionScore,
      passesGrounding: composition.precision.passesGrounding,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    biomarkers?: RuntimeBiomarkers;
    previousClarity?: number | null;
    hour?: number;
  };

  const biomarkers = body.biomarkers ?? buildDemoBiomarkers();
  const at = new Date();
  if (typeof body.hour === "number") {
    at.setHours(body.hour, 0, 0, 0);
  }

  const synthesis = synthesizeNourishment(biomarkers, at);
  const composition = composeProbabilistic({
    biomarkers,
    at,
    seed: 7,
    samples: 16,
  });
  const cyber = assessCybernetics({
    biomarkers,
    previousClarity: body.previousClarity ?? null,
    grounded: composition.precision.passesGrounding,
    precisionScore: composition.precision.precisionScore,
  });

  return NextResponse.json({
    ok: cyber.passes,
    cyber,
    clarityUnderLoad: synthesis.loadState.clarityUnderLoad,
    plateGrounded: composition.precision.passesGrounding,
  });
}
