"use client";

import { useEffect, useMemo, useState } from "react";
import {
  THALI_PATTERNS,
  buildCookableThali,
  decodeShare,
  encodeShare,
  type PatternId,
} from "@/lib/loop/patterns";
import { saveFeedback, type KitchenFeedback } from "@/lib/loop/feedback-store";
import { getTodayEntry } from "@/lib/loop/client-store";
import { todayKey, type LoopEntry } from "@/lib/loop/types";

type Props = {
  initialShare?: string | null;
  initialPattern?: string | null;
};

const CONFUSION_OPTIONS = [
  { id: "language", label: "The words / language" },
  { id: "portions", label: "How much to use (portions)" },
  { id: "steps", label: "The cooking steps" },
  { id: "ingredients", label: "Finding the ingredients" },
  { id: "timing", label: "When to cook / eat" },
  { id: "other", label: "Something else" },
] as const;

export function ThaliSheet({ initialShare, initialPattern }: Props) {
  const shared = useMemo(
    () => (initialShare ? decodeShare(initialShare) : null),
    [initialShare],
  );

  const [today, setToday] = useState<LoopEntry | undefined>(undefined);
  const [patternOverride, setPatternOverride] = useState<PatternId | "auto">(
    (initialPattern as PatternId) || "auto",
  );
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [kitchenName, setKitchenName] = useState("");
  const [confused, setConfused] = useState<string[]>([]);
  const [unclear, setUnclear] = useState("");
  const [worked, setWorked] = useState("");
  const [again, setAgain] = useState<"yes" | "maybe" | "no">("maybe");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    setToday(getTodayEntry());
  }, []);

  const thali = useMemo(() => {
    if (shared) {
      const pattern =
        THALI_PATTERNS.find((p) => p.id === shared.patternId) ??
        THALI_PATTERNS.find((p) => p.id === "balanced")!;
      return {
        headline: shared.headline,
        whyTonight: shared.whyTonight,
        items: shared.items,
        steps: shared.steps,
        avoid: shared.avoid,
        timing: shared.timing,
        pattern,
        composedNote: null as string | null,
        sharePayload: shared,
      };
    }

    const recovery = today?.recovery ?? 58;
    const strain = today?.strain ?? 14.2;
    const sleep = today?.sleepPerformance ?? 78;

    return buildCookableThali({
      date: today?.date ?? todayKey(),
      recovery,
      strain,
      sleepPerformance: sleep,
      loadLabel: today?.loadLabel,
      composedFoods: today?.plate.map((p) => ({
        foodName: p.foodName,
        grams: p.grams,
      })),
      patternId: patternOverride === "auto" ? undefined : patternOverride,
      kitchenLabel: "Hyderabad practice kitchen",
    });
  }, [shared, today, patternOverride]);

  function makeShare() {
    const token = encodeShare(thali.sharePayload);
    const url = `${window.location.origin}/thali?share=${token}`;
    setShareUrl(url);
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function submitFeedback() {
    if (!kitchenName.trim() || confused.length === 0) {
      setFeedbackMsg("Add kitchen name and what was confusing.");
      return;
    }
    const entry: KitchenFeedback = {
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
      shareDate: thali.sharePayload.date,
      patternId: thali.pattern.id,
      kitchenName: kitchenName.trim(),
      city: "Hyderabad",
      confusedAbout: confused as KitchenFeedback["confusedAbout"],
      whatWasUnclear: unclear.trim(),
      whatWorked: worked.trim(),
      wouldCookAgain: again,
    };
    saveFeedback(entry);
    try {
      await fetch("/api/kitchen-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch {
      // local is enough
    }
    setFeedbackMsg("Thank you — noted for the next plate wording.");
    setUnclear("");
    setWorked("");
  }

  const isSecondKitchen = Boolean(shared);

  return (
    <div className="thali-sheet">
      <header className="lab-header no-print">
        <h1>{isSecondKitchen ? "Shared kitchen thali" : "Tonight’s thali"}</h1>
        <p>
          {isSecondKitchen
            ? "Slice C — cook from this page, then tell us what confused you."
            : "Slice B — one page a home cook can follow. Print or share with a second Hyderabad kitchen."}
        </p>
        {!shared && (
          <div className="toolbar">
            <div className="phase-picks" role="group" aria-label="Pattern">
              <button
                type="button"
                className={
                  patternOverride === "auto" ? "phase-pick active" : "phase-pick"
                }
                onClick={() => setPatternOverride("auto")}
              >
                Auto from today
              </button>
              {THALI_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={
                    patternOverride === p.id ? "phase-pick active" : "phase-pick"
                  }
                  onClick={() => setPatternOverride(p.id)}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="toolbar">
          <button className="btn" type="button" onClick={() => window.print()}>
            Print 1-page thali
          </button>
          {!shared && (
            <button className="btn btn-ghost" type="button" onClick={makeShare}>
              {copied ? "Link copied" : "Share with second kitchen"}
            </button>
          )}
          <a className="btn btn-ghost" href="/loop">
            Daily loop
          </a>
          <a className="btn btn-ghost" href="/lab">
            Lab
          </a>
        </div>
        {shareUrl && (
          <p
            className="mono"
            style={{ marginTop: "0.75rem", wordBreak: "break-all" }}
          >
            Share link: {shareUrl}
          </p>
        )}
      </header>

      <section className="section thali-print" style={{ paddingTop: "0.5rem" }}>
        <article className="thali-card">
          <p className="kicker-print">
            Annashakti · Hyderabad · {thali.sharePayload.date}
          </p>
          <h2>{thali.headline}</h2>
          <p className="thali-intent">{thali.pattern.intent}</p>
          <p className="thali-why">{thali.whyTonight}</p>
          <p className="thali-timing">
            <strong>When:</strong> {thali.timing}
          </p>

          <h3>On the counter</h3>
          <ul className="thali-items">
            {thali.items.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong> — {item.amount}
                <span className="thali-how">{item.how}</span>
              </li>
            ))}
          </ul>

          <h3>How to cook</h3>
          <ol className="thali-steps">
            {thali.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <h3>Skip tonight</h3>
          <ul className="thali-avoid">
            {thali.avoid.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>

          {thali.composedNote && (
            <p className="mono thali-lab-note">{thali.composedNote}</p>
          )}

          <p className="thali-foot">
            Lift → Plate → Sleep · Whole food · Not medical advice
          </p>
        </article>

        <aside className="no-print" style={{ marginTop: "2.5rem" }}>
          <h2>
            {isSecondKitchen
              ? "After you cook — what confused you?"
              : "Slice C — second kitchen feedback"}
          </h2>
          <p className="lead">
            One other Hyderabad kitchen cooks from this same page. Tell us where
            language or portions got muddy.
          </p>
          <div className="panel">
            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              Kitchen name
              <input
                value={kitchenName}
                onChange={(e) => setKitchenName(e.target.value)}
                placeholder="e.g. Aunty’s kitchen, Banjara Hills"
                style={inputStyle}
              />
            </label>
            <p style={{ marginBottom: "0.5rem" }}>What was confusing?</p>
            <div className="phase-picks" style={{ marginBottom: "1rem" }}>
              {CONFUSION_OPTIONS.map((o) => {
                const on = confused.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={on ? "phase-pick active" : "phase-pick"}
                    onClick={() =>
                      setConfused((prev) =>
                        on ? prev.filter((x) => x !== o.id) : [...prev, o.id],
                      )
                    }
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              What was unclear?
              <textarea
                value={unclear}
                onChange={(e) => setUnclear(e.target.value)}
                rows={3}
                placeholder="e.g. ‘1 katori’ — which size bowl?"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>
            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              What worked?
              <textarea
                value={worked}
                onChange={(e) => setWorked(e.target.value)}
                rows={2}
                placeholder="e.g. steps were clear, amla amount made sense"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>
            <p style={{ marginBottom: "0.5rem" }}>Would cook again?</p>
            <div className="phase-picks" style={{ marginBottom: "1rem" }}>
              {(["yes", "maybe", "no"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={again === v ? "phase-pick active" : "phase-pick"}
                  onClick={() => setAgain(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              className="btn"
              type="button"
              onClick={() => void submitFeedback()}
            >
              Send kitchen feedback
            </button>
            {feedbackMsg && <p className="mono">{feedbackMsg}</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "0.35rem",
  background: "var(--bg-lift)",
  border: "1px solid var(--line)",
  color: "var(--ink)",
  padding: "0.65rem 0.8rem",
  fontFamily: "var(--font-body)",
};
