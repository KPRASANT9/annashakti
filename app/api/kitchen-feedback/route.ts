import { NextRequest, NextResponse } from "next/server";
import type { KitchenFeedback } from "@/lib/loop/feedback-store";

function databaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

export async function POST(req: NextRequest) {
  const entry = (await req.json().catch(() => null)) as KitchenFeedback | null;
  if (!entry?.id || !entry.kitchenName) {
    return NextResponse.json({ ok: false, error: "feedback" }, { status: 400 });
  }

  const url = databaseUrl();
  if (!url) {
    return NextResponse.json({
      ok: true,
      storage: "local",
      mirrored: false,
      entry,
    });
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    await sql`create table if not exists kitchen_feedback (
      id text primary key,
      payload jsonb not null,
      created_at timestamptz not null default now()
    )`;
    const payload = JSON.stringify(entry);
    await sql`insert into kitchen_feedback (id, payload)
      values (${entry.id}, ${payload}::jsonb)
      on conflict (id) do update set payload = excluded.payload`;
    return NextResponse.json({
      ok: true,
      storage: "neon",
      mirrored: true,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "persist_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  const url = databaseUrl();
  if (!url) {
    return NextResponse.json({ ok: true, storage: "local", rows: [] });
  }
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    await sql`create table if not exists kitchen_feedback (
      id text primary key,
      payload jsonb not null,
      created_at timestamptz not null default now()
    )`;
    const rows =
      await sql`select payload from kitchen_feedback order by created_at desc limit 100`;
    return NextResponse.json({
      ok: true,
      storage: "neon",
      rows: rows.map((r) => r.payload),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "query_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
