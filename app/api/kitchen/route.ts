import { NextRequest, NextResponse } from "next/server";

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function POST(req: NextRequest) {
  const headers = { "Access-Control-Allow-Origin": "*" };
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "json" },
      { status: 400, headers },
    );
  }

  const phrase = normalize(body.phrase);
  const expected = normalize(process.env.KITCHEN_KEY || "first-hundred");
  if (!phrase || phrase !== expected) {
    return NextResponse.json(
      { ok: false, reason: "phrase" },
      { status: 401, headers },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: true, tables: [], rows: [], note: "no-db" },
      { headers },
    );
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const tables = await sql`select relname as name, n_live_tup::int as rows
      from pg_stat_user_tables order by relname`;
    const q = String(body.query || "").trim();
    const rows = q
      ? await sql`select name, email, phone, role, city, created_at from enrollments
          where name ilike ${"%" + q + "%"}
             or email ilike ${"%" + q + "%"}
             or city ilike ${"%" + q + "%"}
             or coalesce(role,'') ilike ${"%" + q + "%"}
          order by created_at desc limit 500`
      : await sql`select name, email, phone, role, city, created_at from enrollments
          order by created_at desc limit 500`;
    return NextResponse.json({ ok: true, tables, rows }, { headers });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "query" },
      { status: 500, headers },
    );
  }
}
