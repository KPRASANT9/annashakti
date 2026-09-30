import { NextRequest, NextResponse } from "next/server";
import type { LoopEntry } from "@/lib/loop/types";

/**
 * Optional server echo for Slice A logs.
 * Primary persistence is browser localStorage so the practitioner loop
 * works without a database. When DATABASE_URL is set, we also mirror rows.
 */

function databaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

export async function GET() {
  const url = databaseUrl();
  if (!url) {
    return NextResponse.json({
      ok: true,
      storage: "local",
      rows: [],
      note: "No DATABASE_URL — use browser loop log.",
    });
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    await sql`create table if not exists loop_entries (
      id text primary key,
      date text not null,
      payload jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;
    const rows = await sql`select payload from loop_entries order by date desc limit 60`;
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

export async function POST(req: NextRequest) {
  const entry = (await req.json().catch(() => null)) as LoopEntry | null;
  if (!entry?.id || !entry.date) {
    return NextResponse.json({ ok: false, error: "entry" }, { status: 400 });
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
    await sql`create table if not exists loop_entries (
      id text primary key,
      date text not null,
      payload jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;
    const payload = JSON.stringify(entry);
    await sql`insert into loop_entries (id, date, payload, updated_at)
      values (${entry.id}, ${entry.date}, ${payload}::jsonb, now())
      on conflict (id) do update set
        date = excluded.date,
        payload = excluded.payload,
        updated_at = now()`;
    return NextResponse.json({
      ok: true,
      storage: "neon",
      mirrored: true,
      entry,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "persist_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
