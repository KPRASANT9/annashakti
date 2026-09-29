import { NextResponse } from "next/server";
import { ingestRuntimeBiomarkers, whoopConfigured, whoopMode } from "@/lib/whoop/client";

export async function GET() {
  try {
    const { biomarkers, connected, mode } = await ingestRuntimeBiomarkers();
    return NextResponse.json({
      ok: true,
      mode,
      connected,
      oauthConfigured: whoopConfigured(),
      envMode: whoopMode(),
      biomarkers,
      metricsExposed: {
        recovery: Object.keys(biomarkers.recovery),
        cycle: Object.keys(biomarkers.cycle),
        sleep: Object.keys(biomarkers.sleep),
        workouts: biomarkers.workouts.length,
        history: {
          recoveries: biomarkers.history.recoveries.length,
          cycles: biomarkers.history.cycles.length,
          sleeps: biomarkers.history.sleeps.length,
          workouts: biomarkers.history.workouts.length,
        },
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "ingest_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
