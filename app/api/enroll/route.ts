import { NextRequest, NextResponse } from "next/server";

function databaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

const LETTERS: Record<
  string,
  { subject: string; body: (name: string) => string }
> = {
  kitchen: {
    subject: "Your kitchen is in the first hundred",
    body: (name) =>
      "Namaste " +
      name +
      ",\n\nYour home is one of the first hundred kitchens.\nNot a factory. A street. A cook. A culture that still knows soak, sprout, ferment, tadka.\nTonight’s thali is the work. Hyderabad first.\n\nLift → Plate → Sleep.\nAnnashakti",
  },
  consumer: {
    subject: "The plate that trains with you",
    body: (name) =>
      "Namaste " +
      name +
      ",\n\nYou arrive as the person the kitchen is for.\nNot a vendor. Not a system. The body that lifts, eats, and sleeps.\nThe gym has you for an hour. Your kitchen has the rest. That is how you stay clear when the day is heavy.\n\nWalk the six assets. Keep the plate honest. Hyderabad first.\n\nLift → Plate → Sleep.\nAnnashakti",
  },
  fitness: {
    subject: "The hour under the bar now writes the plate",
    body: (name) =>
      "Namaste " +
      name +
      ",\n\nYou hold the hour under the bar — written with care.\nThat session is not separate from dinner. It writes tonight’s thali.\nThe Indian body is put back together when the gym and the kitchen stop pretending they are two lives.\n\nLift → Plate → Sleep.\nAnnashakti",
  },
  nutrition: {
    subject: "Whole food, opened — not a packet",
    body: (name) =>
      "Namaste " +
      name +
      ",\n\nYou keep the plate honest.\nDistinguished nutrition here means whole food, opened — not a packet. Millet back on the thali. Craft a person can taste.\nThe first hundred kitchens need that hand.\n\nLift → Plate → Sleep.\nAnnashakti",
  },
  science: {
    subject: "Technique that can be named, taught, repeated",
    body: (name) =>
      "Namaste " +
      name +
      ",\n\nGoverning-body science is the spine of this kitchen.\nTechnique that can be named, taught, and repeated — so a street cook is not guessing, and a home is not left to a packet.\nThat is how a thousand kitchens stay one craft.\n\nLift → Plate → Sleep.\nAnnashakti",
  },
  tech: {
    subject: "So the plate is not an accident",
    body: (name) =>
      "Namaste " +
      name +
      ",\n\nYou handle the chaos with ease.\nThe book, the letter, the street, the first hundred — none of it holds if the system buckles.\nTech veterans here keep the kitchen from becoming an accident.\n\nLift → Plate → Sleep.\nAnnashakti",
  },
};

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
      { ok: false, error: "json" },
      { status: 400, headers },
    );
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || body.mailbox || "")
    .trim()
    .toLowerCase();
  const phone = String(body.phone || "").trim();
  const role = String(body.role || "kitchen").trim();
  const city = String(body.city || "Hyderabad").trim();

  if (name.length < 2) {
    return NextResponse.json(
      { ok: false, error: "name" },
      { status: 400, headers },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "email" },
      { status: 400, headers },
    );
  }

  let stored = false;
  const url = databaseUrl();
  if (url) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(url);
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
      stored = false;
    }
  }

  let mailed = false;
  let mailStatus = "not-sent";
  const letter = LETTERS[role] || LETTERS.kitchen;
  const from = process.env.RESEND_FROM || "Annashakti <hello@annashakti.org>";
  const key = process.env.RESEND_API_KEY || "";
  if (!key) {
    mailStatus = "no-key";
  } else {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: letter.subject,
          text: letter.body(name),
        }),
      });
      mailed = r.ok;
      mailStatus = String(r.status);
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { message?: string };
        mailStatus = String(err.message || r.status).slice(0, 180);
      }
    } catch {
      mailed = false;
      mailStatus = "network";
    }
  }

  return NextResponse.json(
    { ok: true, stored, mailed, mailStatus, name, email, role, city },
    { headers },
  );
}
