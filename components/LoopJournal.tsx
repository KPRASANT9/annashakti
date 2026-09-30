"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getTodayEntry,
  listEntries,
  upsertEntry,
} from "@/lib/loop/client-store";
import type { LoopEntry } from "@/lib/loop/types";
import { todayKey } from "@/lib/loop/types";

async function mirror(entry: LoopEntry) {
  try {
    await fetch("/api/loop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch {
    // local log is source of truth for Slice A
  }
}

export function LoopJournal() {
  const [entries, setEntries] = useState<LoopEntry[]>([]);
  const [today, setToday] = useState<LoopEntry | undefined>();
  const [note, setNote] = useState("");
  const [whoopHint, setWhoopHint] = useState("");

  const refresh = useCallback(() => {
    setEntries(listEntries());
    setToday(getTodayEntry());
  }, []);

  useEffect(() => {
    refresh();
    void (async () => {
      const res = await fetch("/api/whoop/status", { cache: "no-store" });
      const json = (await res.json()) as {
        connected?: boolean;
        configured?: boolean;
        hint?: string;
      };
      setWhoopHint(json.hint ?? "");
    })();
  }, [refresh]);

  async function markCooked() {
    if (!today) return;
    const next: LoopEntry = {
      ...today,
      cooked: true,
      cookedAt: new Date().toISOString(),
      status: "cooked",
      updatedAt: new Date().toISOString(),
    };
    upsertEntry(next);
    await mirror(next);
    refresh();
  }

  async function saveClarity(score: number, entry: LoopEntry) {
    const next: LoopEntry = {
      ...entry,
      clarityNextDay: score,
      clarityNote: note.trim() || entry.clarityNote,
      status: "reviewed",
      updatedAt: new Date().toISOString(),
    };
    upsertEntry(next);
    await mirror(next);
    setNote("");
    refresh();
  }

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return todayKey(d);
  })();
  const pendingClarity = entries.find(
    (e) => e.date === yesterday && e.cooked && e.clarityNextDay == null,
  );

  return (
    <div>
      <header className="lab-header">
        <h1>Daily loop</h1>
        <p>
          Slice A practice: body → plate → cook → sleep → next-day clarity.
          Your log stays in this browser; optional server mirror if DATABASE_URL
          is set.
        </p>
        <div className="toolbar">
          <a className="btn" href="/lab">
            Open lab → accept plate
          </a>
          <a className="btn btn-ghost" href="/thali">
            Tonight’s thali (cook page)
          </a>
          <a className="btn btn-ghost" href="/api/whoop/auth">
            Connect WHOOP
          </a>
          <a className="btn btn-ghost" href="/whoop">
            Inspect metrics
          </a>
        </div>
        {whoopHint && (
          <p className="mono" style={{ marginTop: "0.75rem" }}>
            {whoopHint}
          </p>
        )}
      </header>

      <section className="section" style={{ paddingTop: "0.5rem" }}>
        <h2>Today · {todayKey()}</h2>
        {!today && (
          <article className="panel" style={{ marginTop: "0.75rem" }}>
            <h3>No plate accepted yet</h3>
            <p>
              Go to the Synthesis lab, let the plate ground, then press{" "}
              <strong>Accept today’s plate</strong>. That starts the loop.
            </p>
          </article>
        )}
        {today && (
          <article className="insight" style={{ marginTop: "0.75rem" }}>
            <header>
              <h4>{today.thaliSentence}</h4>
              <span
                className={`badge ${today.grounded ? "badge-pass" : "badge-fail"}`}
              >
                {today.grounded ? "grounded" : "ungrounded"}
              </span>
              <span className="badge">precision {today.precisionScore}</span>
            </header>
            <p className="meta">
              recovery={String(today.recovery)} hrv={String(today.hrv)} strain=
              {String(today.strain)} sleep={String(today.sleepPerformance)} ·{" "}
              {today.source} · {today.lifecyclePhase}
            </p>
            <div className="food-chips">
              {today.plate.map((f) => (
                <span key={f.foodId}>
                  {f.foodName} {f.grams}g
                </span>
              ))}
            </div>
            <div className="toolbar" style={{ marginTop: "1rem" }}>
              {!today.cooked ? (
                <button className="btn" type="button" onClick={() => void markCooked()}>
                  I cooked this plate
                </button>
              ) : (
                <span className="badge badge-pass">cooked</span>
              )}
              {today.clarityNextDay != null && (
                <span className="badge">
                  next-day clarity {today.clarityNextDay}/5
                </span>
              )}
            </div>
          </article>
        )}

        {pendingClarity && (
          <>
            <h2 style={{ marginTop: "2.5rem" }}>Yesterday’s clarity</h2>
            <p className="lead">
              After sleep: how clear did you feel under load? (1 = foggy, 5 =
              clear)
            </p>
            <article className="panel">
              <p>{pendingClarity.thaliSentence}</p>
              <div className="toolbar" style={{ marginTop: "0.75rem" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="phase-pick"
                    onClick={() => void saveClarity(n, pendingClarity)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <label style={{ display: "block", marginTop: "0.75rem" }}>
                Optional note
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. clear in meetings, heavy after 4pm"
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "0.35rem",
                    background: "var(--bg-lift)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                    padding: "0.65rem 0.8rem",
                  }}
                />
              </label>
            </article>
          </>
        )}

        <h2 style={{ marginTop: "2.5rem" }}>Practice log</h2>
        <p className="lead">
          recovery / strain / sleep → plate → cook → next-day clarity
        </p>
        {entries.length === 0 && (
          <p className="mono">Empty — accept your first plate in the lab.</p>
        )}
        <div className="insight-list">
          {entries.map((e) => (
            <article key={e.id} className="panel">
              <h3>
                {e.date}{" "}
                <span className="badge">{e.status}</span>
                {e.clarityNextDay != null && (
                  <span className="badge badge-pass">
                    clarity {e.clarityNextDay}/5
                  </span>
                )}
              </h3>
              <p className="mono">
                R{e.recovery ?? "—"} · HRV{e.hrv ?? "—"} · S{e.strain ?? "—"} ·
                sleep{e.sleepPerformance ?? "—"} · precision {e.precisionScore}
              </p>
              <p>{e.thaliSentence}</p>
              {e.clarityNote && <p className="mono">note: {e.clarityNote}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
