function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function phrasesMatch(given, expected) {
  const a = String(given || "").trim().toLowerCase().replace(/\s+/g, "-");
  const b = String(expected || "").trim().toLowerCase().replace(/\s+/g, "-");
  return a.length > 0 && a === b;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") return send(res, 405, { ok: false, reason: "method" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return send(res, 400, { ok: false, reason: "json" }); }
  }
  body = body || {};

  const expected = (process.env.KITCHEN_KEY || "first-hundred").trim();
  if (!phrasesMatch(body.phrase, expected)) return send(res, 401, { ok: false, reason: "phrase" });

  const q = String(body.query || "").trim().toLowerCase();
  const role = String(body.role || "").trim();

  if (!process.env.DATABASE_URL) {
    return send(res, 200, {
      ok: true,
      stored: false,
      tables: [],
      rows: [],
      note: "Book is open. Connect DATABASE_URL on the Vercel project to persist letters."
    });
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    await sql`create table if not exists enrollments (
      id bigserial primary key,
      name text not null,
      email text not null unique,
      phone text,
      role text,
      city text,
      created_at timestamptz not null default now()
    )`;

    const tables = await sql`select relname as name, n_live_tup::int as rows
      from pg_stat_user_tables order by relname`;

    let rows;
    if (q && role) {
      const like = "%" + q + "%";
      rows = await sql`select id, name, email, phone, role, city, created_at
        from enrollments
        where role = ${role}
          and (lower(name) like ${like} or lower(email) like ${like} or lower(city) like ${like})
        order by created_at desc limit 500`;
    } else if (q) {
      const like = "%" + q + "%";
      rows = await sql`select id, name, email, phone, role, city, created_at
        from enrollments
        where lower(name) like ${like} or lower(email) like ${like} or lower(city) like ${like}
        order by created_at desc limit 500`;
    } else if (role) {
      rows = await sql`select id, name, email, phone, role, city, created_at
        from enrollments where role = ${role} order by created_at desc limit 500`;
    } else {
      rows = await sql`select id, name, email, phone, role, city, created_at
        from enrollments order by created_at desc limit 500`;
    }

    return send(res, 200, { ok: true, stored: true, tables, rows });
  } catch {
    return send(res, 500, { ok: false, reason: "book" });
  }
};
