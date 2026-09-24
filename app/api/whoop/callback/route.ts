import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, persistTokens } from "@/lib/whoop/client";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/lab?whoop=error&reason=${encodeURIComponent(error)}`,
    );
  }

  const jar = await cookies();
  const expected = jar.get("annashakti_whoop_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(`${appUrl}/lab?whoop=error&reason=state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await persistTokens(tokens);
    jar.delete("annashakti_whoop_oauth_state");
    return NextResponse.redirect(`${appUrl}/lab?whoop=connected`);
  } catch (e) {
    const message = e instanceof Error ? e.message : "token_exchange_failed";
    return NextResponse.redirect(
      `${appUrl}/lab?whoop=error&reason=${encodeURIComponent(message)}`,
    );
  }
}
