"use client";

import { useCallback, useEffect, useState } from "react";

type Assessment = {
  totalInsights: number;
  valuePassing: number;
  rejected: number;
  meanValueScore: number;
  topValidated: Array<{
    id: string;
    title: string;
    valueScore: number;
    evidence: string;
    domain: string;
  }>;
  rejectedSample: Array<{
    id: string;
    title: string;
    valueScore: number;
    caveats: string[];
    failedChecks: string[];
  }>;
};

type SynthesisPayload = {
  ok: boolean;
  mode: string;
  connected: boolean;
  assessment: Assessment;
  synthesis: {
    generatedAt: string;
    lifecycle: {
      phase: string;
      label: string;
      nourishmentFocus: string;
      localHour: number;
    };
    biomarkers: {
      recovery: {
        score: number | null;
        hrvRmssdMilli: number | null;
      };
      cycle: {
        strain: number | null;
      };
      sleep: {
        performancePercent: number | null;
      };
    };
    loadState: {
      label: string;
      recoveryBand: string;
      strainBand: string;
      sleepBand: string;
      clarityUnderLoad: number;
    };
    insights: Array<{
      id: string;
      title: string;
      summary: string;
      domain: string;
      domainTitle: string;
      evidence: string;
      biomarkerSignals: string[];
      nutrients: string[];
      mechanism: string;
      appliedGuidance: string;
      nutrientAuthority: string;
      signalStrength: number;
    }>;
    validations: Array<{
      insightId: string;
      valueScore: number;
      passes: boolean;
      checks: Array<{
        id: string;
        label: string;
        passed: boolean;
        detail: string;
      }>;
      caveats: string[];
    }>;
    nutrientPlan: Array<{
      nutrientId: string;
      name: string;
      unit: string;
      rda: number;
      priority: number;
      governingBody: string;
      reason: string;
      foodSuggestions: string[];
    }>;
    scienceCoverage: Record<string, number>;
    methodNotes: string[];
  };
};

const HOURS = [
  { value: "", label: "Now (local)" },
  { value: "7", label: "07:00 morning" },
  { value: "12", label: "12:00 midday" },
  { value: "16", label: "16:00 training" },
  { value: "20", label: "20:00 wind-down" },
  { value: "23", label: "23:00 deep recovery" },
];

export function SynthesisLab() {
  const [hour, setHour] = useState("");
  const [demo, setDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SynthesisPayload | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (demo) params.set("demo", "1");
      if (hour) params.set("hour", hour);
      const res = await fetch(`/api/synthesize?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as SynthesisPayload & { error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Synthesis failed");
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [demo, hour]);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <div>
      <header className="lab-header">
        <h1>Synthesis lab</h1>
        <p>
          Experiment with how WHOOP biomarkers are curated at runtime and
          synthesized into ICMR-NIN-aligned nourishment — then validate which
          insights truly carry value under load.
        </p>
        <div className="toolbar">
          <div className="phase-picks" role="group" aria-label="Lifecycle hour">
            {HOURS.map((h) => (
              <button
                key={h.value || "now"}
                type="button"
                className={hour === h.value ? "phase-pick active" : "phase-pick"}
                onClick={() => setHour(h.value)}
              >
                {h.label}
              </button>
            ))}
          </div>
          <label>
            <input
              type="checkbox"
              checked={demo}
              onChange={(e) => setDemo(e.target.checked)}
            />{" "}
            Demo WHOOP fixtures
          </label>
          <button className="btn" type="button" onClick={() => void run()} disabled={loading}>
            {loading ? "Synthesizing…" : "Re-synthesize"}
          </button>
          <a className="btn btn-ghost" href="/api/whoop/auth">
            Connect WHOOP
          </a>
        </div>
      </header>

      <section className="section" style={{ paddingTop: "1rem" }}>
        {error && <p className="err">{error}</p>}

        {data && (
          <>
            <div className="status-bar">
              <span>mode={data.mode}</span>
              <span>connected={String(data.connected)}</span>
              <span>phase={data.synthesis.lifecycle.phase}</span>
              <span>
                clarity_under_load={data.synthesis.loadState.clarityUnderLoad}
              </span>
              <span>
                validated={data.assessment.valuePassing}/
                {data.assessment.totalInsights}
              </span>
              <span>
                mean_value={data.assessment.meanValueScore.toFixed(0)}
              </span>
            </div>

            <div className="metric-grid" style={{ marginBottom: "1.75rem" }}>
              <div className="metric">
                <div className="label">Load state</div>
                <div className="value" style={{ fontSize: "1.05rem" }}>
                  {data.synthesis.loadState.label}
                </div>
              </div>
              <div className="metric">
                <div className="label">Recovery</div>
                <div className="value">
                  {data.synthesis.biomarkers.recovery.score ?? "—"}
                </div>
              </div>
              <div className="metric">
                <div className="label">HRV</div>
                <div className="value">
                  {data.synthesis.biomarkers.recovery.hrvRmssdMilli ?? "—"}
                  <span className="unit"> ms</span>
                </div>
              </div>
              <div className="metric">
                <div className="label">Strain</div>
                <div className="value">
                  {data.synthesis.biomarkers.cycle.strain?.toFixed?.(1) ??
                    data.synthesis.biomarkers.cycle.strain ??
                    "—"}
                </div>
              </div>
              <div className="metric">
                <div className="label">Sleep perf.</div>
                <div className="value">
                  {data.synthesis.biomarkers.sleep.performancePercent ?? "—"}
                  <span className="unit">%</span>
                </div>
              </div>
              <div className="metric">
                <div className="label">Lifecycle</div>
                <div className="value" style={{ fontSize: "1.05rem" }}>
                  {data.synthesis.lifecycle.label}
                </div>
              </div>
            </div>

            <div className="split">
              <div>
                <h2>Validated insights</h2>
                <p className="lead">
                  {data.synthesis.lifecycle.nourishmentFocus}
                </p>
                <div className="insight-list">
                  {data.synthesis.insights.map((insight) => {
                    const validation = data.synthesis.validations.find(
                      (v) => v.insightId === insight.id,
                    );
                    if (!validation) return null;
                    return (
                      <article key={insight.id} className="insight">
                        <header>
                          <h4>{insight.title}</h4>
                          <span className={`badge badge-${insight.evidence.toLowerCase()}`}>
                            evidence {insight.evidence}
                          </span>
                          <span
                            className={`badge ${validation.passes ? "badge-pass" : "badge-fail"}`}
                          >
                            value {validation.valueScore}
                            {validation.passes ? " pass" : " hold"}
                          </span>
                        </header>
                        <p className="meta">
                          {insight.biomarkerSignals.join(" · ")} · signal{" "}
                          {insight.signalStrength} · {insight.nutrientAuthority}
                        </p>
                        <p>{insight.appliedGuidance}</p>
                        <p>
                          <em>{insight.mechanism}</em>
                        </p>
                        <ul className="checks">
                          {validation.checks.map((c) => (
                            <li key={c.id} data-ok={c.passed}>
                              [{c.passed ? "ok" : "no"}] {c.label} — {c.detail}
                            </li>
                          ))}
                        </ul>
                        {validation.caveats.length > 0 && (
                          <p className="mono">
                            caveats: {validation.caveats.join(" | ")}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2>Nutrient priorities</h2>
                <p className="lead">
                  Ranked from validated synthesis against ICMR-NIN / governing
                  body RDAs.
                </p>
                <div className="insight-list">
                  {data.synthesis.nutrientPlan.map((n) => (
                    <article key={n.nutrientId} className="panel">
                      <h3>
                        {n.name}{" "}
                        <span className="badge">priority {n.priority}</span>
                      </h3>
                      <p>
                        RDA {n.rda}
                        {n.unit} · {n.governingBody}
                      </p>
                      <p>{n.reason}</p>
                      <div className="food-chips">
                        {n.foodSuggestions.map((f) => (
                          <span key={f}>{f}</span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>

                <h2 style={{ marginTop: "2rem" }}>Science coverage</h2>
                <div className="domain-rail" style={{ marginTop: "1rem" }}>
                  {Object.entries(data.synthesis.scienceCoverage).map(
                    ([domain, count]) => (
                      <article key={domain}>
                        <div className="count">{count}</div>
                        <div>
                          <strong style={{ fontFamily: "var(--font-display)" }}>
                            {domain.replaceAll("_", " ")}
                          </strong>
                        </div>
                      </article>
                    ),
                  )}
                </div>

                <h2 style={{ marginTop: "2rem" }}>Method</h2>
                <ul className="checks" style={{ marginTop: "0.75rem" }}>
                  {data.synthesis.methodNotes.map((note) => (
                    <li key={note} data-ok="true">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
