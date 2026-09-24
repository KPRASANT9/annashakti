"use client";

import { useCallback, useEffect, useState } from "react";

type Assessment = {
  totalInsights: number;
  valuePassing: number;
  rejected: number;
  meanValueScore: number;
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
      recovery: { score: number | null; hrvRmssdMilli: number | null };
      cycle: { strain: number | null };
      sleep: { performancePercent: number | null };
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

type ComposePayload = {
  ok: boolean;
  frontierAvailable: boolean;
  composition: {
    method: string;
    frontierModel: string | null;
    seed: number;
    lifecyclePhase: string;
    foundations: Array<{
      nutrientId: string;
      name: string;
      governingBody: string;
      rda: number;
      unit: string;
      prior: number;
      likelihood: number;
      posterior: number;
      ci95: [number, number];
      evidenceSupport: string;
      scientificDomains: string[];
    }>;
    composition: Array<{
      foodId: string;
      foodName: string;
      category: string;
      grams: number;
      selectionProbability: number;
      scientificRole: string;
    }>;
    precision: {
      expectedRdaCoverage: number;
      coverageUncertainty: number;
      evidenceAnchoredMass: number;
      precisionScore: number;
      passesGrounding: boolean;
      groundingChecks: Array<{
        id: string;
        passed: boolean;
        detail: string;
      }>;
    };
    frontierNarrative: string | null;
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
  const [useFrontier, setUseFrontier] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SynthesisPayload | null>(null);
  const [compose, setCompose] = useState<ComposePayload | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (demo) params.set("demo", "1");
      if (hour) params.set("hour", hour);

      const composeParams = new URLSearchParams(params);
      if (!useFrontier) composeParams.set("frontier", "0");
      composeParams.set("seed", String(Date.now() % 1e9));

      const [synthRes, composeRes] = await Promise.all([
        fetch(`/api/synthesize?${params.toString()}`, { cache: "no-store" }),
        fetch(`/api/compose?${composeParams.toString()}`, { cache: "no-store" }),
      ]);

      const synthJson = (await synthRes.json()) as SynthesisPayload & {
        error?: string;
      };
      const composeJson = (await composeRes.json()) as ComposePayload & {
        error?: string;
      };

      if (!synthRes.ok || !synthJson.ok) {
        throw new Error(synthJson.error ?? "Synthesis failed");
      }
      if (!composeRes.ok || !composeJson.ok) {
        throw new Error(composeJson.error ?? "Composition failed");
      }

      setData(synthJson);
      setCompose(composeJson);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [demo, hour, useFrontier]);

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
          insights truly carry value under load. Probabilistic composition
          updates nutrient foundations with Bayesian posteriors; frontier models
          may dictate candidates, then get re-grounded before they guide the
          plate.
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
          <label>
            <input
              type="checkbox"
              checked={useFrontier}
              onChange={(e) => setUseFrontier(e.target.checked)}
            />{" "}
            Frontier dictation
            {compose
              ? compose.frontierAvailable
                ? " (key present)"
                : " (local Bayes — add API key)"
              : ""}
          </label>
          <button
            className="btn"
            type="button"
            onClick={() => void run()}
            disabled={loading}
          >
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
              {compose && (
                <>
                  <span>compose={compose.composition.method}</span>
                  <span>
                    precision={compose.composition.precision.precisionScore}
                    {compose.composition.precision.passesGrounding
                      ? " grounded"
                      : " hold"}
                  </span>
                </>
              )}
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

            {compose && (
              <div style={{ marginBottom: "2.5rem" }}>
                <h2>Probabilistic plate</h2>
                <p className="lead">
                  Foundations are Bayesian posteriors over ICMR-NIN priors ×
                  WHOOP likelihood × evidence temper. Frontier models may
                  dictate candidates; precision is accepted only after grounding
                  checks.
                </p>

                <div className="metric-grid" style={{ marginBottom: "1.25rem" }}>
                  <div className="metric">
                    <div className="label">Precision</div>
                    <div className="value">
                      {compose.composition.precision.precisionScore}
                    </div>
                  </div>
                  <div className="metric">
                    <div className="label">RDA coverage</div>
                    <div className="value">
                      {(
                        compose.composition.precision.expectedRdaCoverage * 100
                      ).toFixed(0)}
                      <span className="unit">%</span>
                    </div>
                  </div>
                  <div className="metric">
                    <div className="label">Uncertainty σ</div>
                    <div className="value" style={{ fontSize: "1.25rem" }}>
                      {compose.composition.precision.coverageUncertainty.toFixed(
                        3,
                      )}
                    </div>
                  </div>
                  <div className="metric">
                    <div className="label">A/B mass</div>
                    <div className="value">
                      {(
                        compose.composition.precision.evidenceAnchoredMass * 100
                      ).toFixed(0)}
                      <span className="unit">%</span>
                    </div>
                  </div>
                  <div className="metric">
                    <div className="label">Method</div>
                    <div className="value" style={{ fontSize: "1rem" }}>
                      {compose.composition.method.replaceAll("_", " ")}
                    </div>
                  </div>
                  <div className="metric">
                    <div className="label">Seed</div>
                    <div className="value" style={{ fontSize: "1rem" }}>
                      {compose.composition.seed}
                    </div>
                  </div>
                </div>

                <div className="split">
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        margin: "0 0 0.75rem",
                      }}
                    >
                      Posterior foundations
                    </h3>
                    <div className="insight-list">
                      {compose.composition.foundations.slice(0, 8).map((f) => (
                        <article key={f.nutrientId} className="panel">
                          <h3>
                            {f.name}{" "}
                            <span
                              className={`badge badge-${f.evidenceSupport.toLowerCase()}`}
                            >
                              {f.evidenceSupport}
                            </span>
                          </h3>
                          <p>
                            posterior {(f.posterior * 100).toFixed(1)}% · CI95 [
                            {(f.ci95[0] * 100).toFixed(1)}–
                            {(f.ci95[1] * 100).toFixed(1)}%] · prior{" "}
                            {(f.prior * 100).toFixed(1)}% · L=
                            {f.likelihood.toFixed(2)}
                          </p>
                          <p>
                            RDA {f.rda}
                            {f.unit} · {f.governingBody}
                            {f.scientificDomains.length
                              ? ` · ${f.scientificDomains.join(", ").replaceAll("_", " ")}`
                              : ""}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        margin: "0 0 0.75rem",
                      }}
                    >
                      Composed elements
                    </h3>
                    <div className="insight-list">
                      {compose.composition.composition.map((el) => (
                        <article key={el.foodId} className="insight">
                          <header>
                            <h4>
                              {el.foodName} · {el.grams}g
                            </h4>
                            <span className="badge">
                              p={el.selectionProbability.toFixed(3)}
                            </span>
                          </header>
                          <p>{el.scientificRole}</p>
                          <p className="meta">{el.category}</p>
                        </article>
                      ))}
                    </div>

                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        margin: "1.5rem 0 0.75rem",
                      }}
                    >
                      Grounding
                    </h3>
                    <ul className="checks">
                      {compose.composition.precision.groundingChecks.map(
                        (c) => (
                          <li key={c.id} data-ok={c.passed}>
                            [{c.passed ? "ok" : "no"}] {c.detail}
                          </li>
                        ),
                      )}
                    </ul>

                    {compose.composition.frontierNarrative && (
                      <>
                        <h3
                          style={{
                            fontFamily: "var(--font-display)",
                            margin: "1.5rem 0 0.75rem",
                          }}
                        >
                          Frontier narrative
                          {compose.composition.frontierModel
                            ? ` · ${compose.composition.frontierModel}`
                            : ""}
                        </h3>
                        <p className="panel">
                          {compose.composition.frontierNarrative}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                          <span
                            className={`badge badge-${insight.evidence.toLowerCase()}`}
                          >
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
                  {compose?.composition.methodNotes.map((note) => (
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
