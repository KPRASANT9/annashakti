import { NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  whoopConfigured,
  whoopMode,
} from "@/lib/whoop/client";
import { randomBytes } from "crypto";

export async function GET() {
  if (!whoopConfigured()) {
    return NextResponse.json(
      {
        error: "WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET not configured",
        mode: whoopMode(),
        hint: "Add credentials to .env or continue experimenting in demo mode.",
      },
      { status: 400 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const url = buildAuthorizeUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set("annashakti_whoop_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
