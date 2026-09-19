function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "method" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return send(res, 400, { ok: false, error: "json" }); }
  }
  body = body || {};

  const name = String(body.name || "").trim();
  const email = String(body.email || body.mailbox || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const role = String(body.role || "kitchen").trim();
  const city = String(body.city || "Hyderabad").trim();

  if (name.length < 2) return send(res, 400, { ok: false, error: "name" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { ok: false, error: "email" });

  let stored = false;
  if (process.env.DATABASE_URL) {
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
      await sql`insert into enrollments (name, email, phone, role, city)
        values (${name}, ${email}, ${phone}, ${role}, ${city})
        on conflict (email) do update set
          name = excluded.name, phone = excluded.phone, role = excluded.role, city = excluded.city`;
      stored = true;
    } catch {
      return send(res, 500, { ok: false, error: "store" });
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Annashakti <hello@annashakti.org>",
          to: [email],
          subject: "Your place is kept",
          text: "Namaste " + name + ",\n\nYour place is in the kitchen book.\nFirst 100 kitchens. Hyderabad.\nLift \u2192 Plate \u2192 Sleep.\n\nAnnashakti"
        })
      });
    } catch {}
  }

  send(res, 200, { ok: true, stored, name, email, role, city });
};
