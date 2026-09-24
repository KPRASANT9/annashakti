import { NextRequest, NextResponse } from "next/server";
import { synthesizeNourishment } from "@/lib/synthesis/engine";
import { ingestRuntimeBiomarkers } from "@/lib/whoop/client";
import { buildDemoBiomarkers } from "@/lib/whoop/demo";
import type { RuntimeBiomarkers } from "@/lib/whoop/types";

export async function GET(req: NextRequest) {
  const forceDemo = req.nextUrl.searchParams.get("demo") === "1";
  const hourParam = req.nextUrl.searchParams.get("hour");

  let biomarkers: RuntimeBiomarkers;
  let connected = false;
  let mode: "demo" | "live" = "demo";

  if (forceDemo) {
    biomarkers = buildDemoBiomarkers();
  } else {
    const ingested = await ingestRuntimeBiomarkers();
    biomarkers = ingested.biomarkers;
    connected = ingested.connected;
    mode = ingested.mode;
  }

  const at = new Date();
  if (hourParam != null && hourParam !== "") {
    const hour = Number(hourParam);
    if (!Number.isNaN(hour) && hour >= 0 && hour < 24) {
      at.setHours(hour, 0, 0, 0);
    }
  }

  const synthesis = synthesizeNourishment(biomarkers, at);
  const validatedInsights = synthesis.insights.map((insight) => {
    const validation = synthesis.validations.find(
      (v) => v.insightId === insight.id,
    )!;
    return { insight, validation };
  });

  const passed = validatedInsights.filter((v) => v.validation.passes);
  const rejected = validatedInsights.filter((v) => !v.validation.passes);

  return NextResponse.json({
    ok: true,
    mode,
    connected,
    synthesis,
    assessment: {
      totalInsights: validatedInsights.length,
      valuePassing: passed.length,
      rejected: rejected.length,
      meanValueScore:
        validatedInsights.reduce((s, v) => s + v.validation.valueScore, 0) /
        Math.max(validatedInsights.length, 1),
      topValidated: passed
        .sort((a, b) => b.validation.valueScore - a.validation.valueScore)
        .slice(0, 5)
        .map((v) => ({
          id: v.insight.id,
          title: v.insight.title,
          valueScore: v.validation.valueScore,
          evidence: v.insight.evidence,
          domain: v.insight.domain,
        })),
      rejectedSample: rejected.slice(0, 3).map((v) => ({
        id: v.insight.id,
        title: v.insight.title,
        valueScore: v.validation.valueScore,
        caveats: v.validation.caveats,
        failedChecks: v.validation.checks
          .filter((c) => !c.passed)
          .map((c) => c.label),
      })),
    },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    biomarkers?: RuntimeBiomarkers;
    hour?: number;
  };

  const biomarkers = body.biomarkers ?? buildDemoBiomarkers();
  const at = new Date();
  if (typeof body.hour === "number") {
    at.setHours(body.hour, 0, 0, 0);
  }

  const synthesis = synthesizeNourishment(biomarkers, at);
  return NextResponse.json({ ok: true, synthesis });
}
