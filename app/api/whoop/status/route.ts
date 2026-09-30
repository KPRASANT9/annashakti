import { NextRequest, NextResponse } from "next/server";
import {
  whoopConfigured,
  whoopMode,
} from "@/lib/whoop/client";
import { cookies } from "next/headers";

/** Lightweight WHOOP connection status for Slice A UI. */
export async function GET() {
  const jar = await cookies();
  const hasCookie = Boolean(jar.get("annashakti_whoop_token")?.value);
  const hasAccessEnv = Boolean(process.env.WHOOP_ACCESS_TOKEN);
  const configured = whoopConfigured();
  const mode = whoopMode();
  const connected = hasCookie || hasAccessEnv;

  return NextResponse.json({
    ok: true,
    configured,
    connected,
    mode,
    canAuthorize: configured,
    hint: connected
      ? "WHOOP live path available — uncheck Demo fixtures in the lab."
      : configured
        ? "Click Connect WHOOP to authorize your account."
        : "Add WHOOP_CLIENT_ID + WHOOP_CLIENT_SECRET (or WHOOP_ACCESS_TOKEN) in .env.local for live data. Demo fixtures work until then.",
  });
}

export async function POST(req: NextRequest) {
  // Reserved for future server-side loop sync; Slice A uses localStorage.
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    ok: true,
    received: body,
    note: "Slice A persists the practice log in the browser (localStorage).",
  });
}
