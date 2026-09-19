function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
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

  const phrase = normalize(body.phrase);
  const expected = normalize(process.env.KITCHEN_KEY || "first-hundred");
  if (!phrase || phrase !== expected) return send(res, 401, { ok: false, reason: "phrase" });

  if (!process.env.DATABASE_URL) {
    return send(res, 200, { ok: true, tables: [], rows: [], note: "no-db" });
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
    return send(res, 200, { ok: true, tables, rows });
  } catch {
    return send(res, 500, { ok: false, reason: "query" });
  }
};
