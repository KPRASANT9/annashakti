import { NextRequest, NextResponse } from "next/server";
import {
  buildFrontierBrief,
  composeProbabilistic,
  composeWithFrontierBias,
  computeFoundations,
  dictateWithFrontierModel,
} from "@/lib/synthesis/probabilistic";
import { synthesizeNourishment } from "@/lib/synthesis/engine";
import { ingestRuntimeBiomarkers } from "@/lib/whoop/client";
import { buildDemoBiomarkers } from "@/lib/whoop/demo";

export async function GET(req: NextRequest) {
  const forceDemo = req.nextUrl.searchParams.get("demo") === "1";
  const hourParam = req.nextUrl.searchParams.get("hour");
  const seedParam = req.nextUrl.searchParams.get("seed");
  const useFrontier = req.nextUrl.searchParams.get("frontier") !== "0";

  const ingested = forceDemo
    ? {
        biomarkers: buildDemoBiomarkers(),
        connected: false,
        mode: "demo" as const,
      }
    : await ingestRuntimeBiomarkers();

  const at = new Date();
  if (hourParam != null && hourParam !== "") {
    const hour = Number(hourParam);
    if (!Number.isNaN(hour) && hour >= 0 && hour < 24) {
      at.setHours(hour, 0, 0, 0);
    }
  }

  const seed = seedParam ? Number(seedParam) : Math.floor(Math.random() * 1e9);
  const synthesis = synthesizeNourishment(ingested.biomarkers, at);
  const foundations = computeFoundations(synthesis);

  let frontierNarrative: string | null = null;
  let frontierModel: string | null = null;
  let suggestedFoodIds: string[] = [];

  if (useFrontier) {
    const brief = buildFrontierBrief(
      ingested.biomarkers,
      foundations,
      synthesis,
    );
    const frontier = await dictateWithFrontierModel(brief);
    if (frontier) {
      frontierNarrative = frontier.narrative;
      frontierModel = frontier.model;
      suggestedFoodIds = frontier.suggestedFoodIds;
    }
  }

  let composition = composeProbabilistic({
    biomarkers: ingested.biomarkers,
    at,
    seed,
    frontierNarrative,
    frontierModel,
  });

  if (frontierModel && suggestedFoodIds.length > 0) {
    composition = composeWithFrontierBias(
      composition,
      suggestedFoodIds,
      ingested.biomarkers,
      at,
      seed,
    );
    composition.frontierNarrative = frontierNarrative;
    composition.frontierModel = frontierModel;
  }

  return NextResponse.json({
    ok: true,
    mode: ingested.mode,
    connected: ingested.connected,
    frontierAvailable: Boolean(
      process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
    ),
    composition,
    topFoundations: composition.foundations.slice(0, 8).map((f) => ({
      nutrient: f.name,
      posterior: f.posterior,
      ci95: f.ci95,
      evidence: f.evidenceSupport,
      authority: f.governingBody,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    demo?: boolean;
    hour?: number;
    seed?: number;
    frontier?: boolean;
  };

  const url = new URL(req.url);
  if (body.demo) url.searchParams.set("demo", "1");
  if (typeof body.hour === "number") url.searchParams.set("hour", String(body.hour));
  if (typeof body.seed === "number") url.searchParams.set("seed", String(body.seed));
  if (body.frontier === false) url.searchParams.set("frontier", "0");

  return GET(new NextRequest(url));
}
