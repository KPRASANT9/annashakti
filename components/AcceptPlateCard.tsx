"use client";

import { useState } from "react";
import { upsertEntry } from "@/lib/loop/client-store";
import {
  buildThaliSentence,
  todayKey,
  type LoopEntry,
  type LoopPlateItem,
} from "@/lib/loop/types";

type Props = {
  grounded: boolean;
  precisionScore: number;
  composeMethod: string;
  seed: number;
  source: "whoop_live" | "whoop_demo";
  recovery: number | null;
  hrv: number | null;
  strain: number | null;
  sleepPerformance: number | null;
  clarityUnderLoad: number | null;
  loadLabel: string;
  lifecyclePhase: string;
  foods: LoopPlateItem[];
};

export function AcceptPlateCard(props: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  const thali = buildThaliSentence({
    foods: props.foods,
    loadLabel: props.loadLabel,
    recovery: props.recovery,
    strain: props.strain,
  });

  async function accept(force = false) {
    if (busy || accepted) return;
    setBusy(true);
    setMessage(null);
    try {
      if (!props.grounded && !force) {
        setMessage(
          "Plate is not grounded yet — re-synthesize, or force-accept only if you accept the caveat.",
        );
        return;
      }

      const now = new Date().toISOString();
      const entry: LoopEntry = {
        id: `loop-${todayKey()}`,
        date: todayKey(),
        createdAt: now,
        updatedAt: now,
        source: props.source,
        recovery: props.recovery,
        hrv: props.hrv,
        strain: props.strain,
        sleepPerformance: props.sleepPerformance,
        clarityUnderLoad: props.clarityUnderLoad,
        loadLabel: props.loadLabel,
        lifecyclePhase: props.lifecyclePhase,
        plate: props.foods,
        thaliSentence: thali,
        precisionScore: props.precisionScore,
        grounded: props.grounded,
        composeMethod: props.composeMethod,
        seed: props.seed,
        cooked: false,
        cookedAt: null,
        clarityNextDay: null,
        clarityNote:
          force && !props.grounded ? "force-accepted ungrounded" : null,
        status: "accepted",
      };

      upsertEntry(entry);
      void fetch("/api/loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }).catch(() => undefined);

      setAccepted(true);
      setMessage("Plate accepted for today. Open Daily loop to mark cooked.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not accept plate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="insight"
      style={{ marginBottom: "1.5rem", position: "relative", zIndex: 5 }}
      data-testid="slice-a-thali"
    >
      <header>
        <h4>Tonight’s thali (Slice A)</h4>
        <span
          className={`badge ${props.grounded ? "badge-pass" : "badge-fail"}`}
        >
          {props.grounded ? "grounded — can accept" : "hold — not grounded"}
        </span>
      </header>
      <p style={{ fontSize: "1.05rem", color: "var(--ink)" }}>{thali}</p>
      <div className="food-chips">
        {props.foods.map((f) => (
          <span key={f.foodId}>
            {f.foodName} · {f.grams}g
          </span>
        ))}
      </div>
      <div className="toolbar" style={{ marginTop: "1rem" }}>
        <button
          className="btn"
          type="button"
          data-testid="accept-plate"
          disabled={accepted || busy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void accept(false);
          }}
        >
          {accepted ? "Accepted for today" : busy ? "Saving…" : "Accept today’s plate"}
        </button>
        {!props.grounded && (
          <button
            className="btn btn-ghost"
            type="button"
            data-testid="force-accept-plate"
            disabled={accepted || busy}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void accept(true);
            }}
          >
            Force-accept with caveat
          </button>
        )}
        <a className="btn btn-ghost" href="/loop">
          Open daily loop
        </a>
      </div>
      {message && (
        <p className="mono" data-testid="accept-message">
          {message}
        </p>
      )}
    </article>
  );
}
