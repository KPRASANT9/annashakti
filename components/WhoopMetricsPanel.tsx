"use client";

import { useEffect, useState } from "react";

const LABELS: Record<string, string> = {
  score: "Recovery score",
  restingHeartRate: "Resting HR",
  hrvRmssdMilli: "HRV (RMSSD)",
  spo2Percent: "SpO₂",
  skinTempCelsius: "Skin temp",
  calibrating: "Calibrating",
  strain: "Strain",
  kilojoule: "Energy",
  averageHeartRate: "Avg HR",
  maxHeartRate: "Max HR",
  start: "Start",
  end: "End",
  performancePercent: "Sleep performance",
  consistencyPercent: "Consistency",
  efficiencyPercent: "Efficiency",
  respiratoryRate: "Respiratory rate",
  totalSleepHours: "Total sleep",
  remHours: "REM",
  slowWaveHours: "Slow-wave",
  lightHours: "Light",
  disturbanceCount: "Disturbances",
  sleepDebtHours: "Sleep debt",
};

function labelFor(key: string) {
  return LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function formatValue(key: string, v: number | string | boolean | null | undefined) {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "number") {
    if (key.toLowerCase().includes("percent")) return `${Number(v.toFixed(1))}%`;
    if (key.toLowerCase().includes("hour")) return `${Number(v.toFixed(1))} h`;
    if (key === "hrvRmssdMilli") return `${Math.round(v)} ms`;
    if (key === "skinTempCelsius") return `${Number(v.toFixed(1))} °C`;
    if (key === "kilojoule") return `${Math.round(v)} kJ`;
    if (key.includes("HeartRate") || key === "restingHeartRate") return `${Math.round(v)} bpm`;
    if (Number.isInteger(v)) return String(v);
    return Number(v.toFixed(2)).toString();
  }
  if (typeof v === "string" && v.includes("T") && v.endsWith("Z")) {
    try {
      return new Date(v).toLocaleString();
    } catch {
      return v;
    }
  }
  return String(v);
}

type MetricsPayload = {
  ok: boolean;
  mode: string;
  connected: boolean;
  oauthConfigured: boolean;
  biomarkers: {
    capturedAt: string;
    source: string;
    profile?: { first_name: string; last_name: string; email: string };
    body?: {
      height_meter: number;
      weight_kilogram: number;
      max_heart_rate: number;
    };
    recovery: Record<string, number | boolean | null>;
    cycle: Record<string, number | string | null>;
    sleep: Record<string, number | null>;
    workouts: Array<Record<string, number | string | null>>;
    history: {
      recoveries: unknown[];
      cycles: unknown[];
      sleeps: unknown[];
      workouts: unknown[];
    };
  };
  metricsExposed: Record<string, unknown>;
  error?: string;
};

export function WhoopMetricsPanel() {
  const [data, setData] = useState<MetricsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/whoop/metrics", { cache: "no-store" });
        const json = (await res.json()) as MetricsPayload;
        if (!json.ok) throw new Error(json.error ?? "Failed to load metrics");
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    })();
  }, []);

  if (error) return <p className="err">{error}</p>;
  if (!data) return <p className="mono">Loading WHOOP runtime bundle…</p>;

  const b = data.biomarkers;

  return (
    <>
      <div className="status-bar">
        <span>source={b.source}</span>
        <span>mode={data.mode}</span>
        <span>connected={String(data.connected)}</span>
        <span>oauth={String(data.oauthConfigured)}</span>
        <span>captured={b.capturedAt}</span>
      </div>

      {b.profile && (
        <p style={{ color: "var(--ink-muted)" }}>
          {b.profile.first_name} {b.profile.last_name} · {b.profile.email}
          {b.body
            ? ` · ${b.body.weight_kilogram} kg · max HR ${b.body.max_heart_rate}`
            : ""}
        </p>
      )}

      <h2 style={{ marginTop: "1.5rem" }}>Recovery</h2>
      <div className="metric-grid" style={{ margin: "0.75rem 0 1.5rem" }}>
        {Object.entries(b.recovery).map(([k, v]) => (
          <div className="metric" key={k}>
            <div className="label">{labelFor(k)}</div>
            <div className="value" style={{ fontSize: "1.25rem" }}>
              {formatValue(k, v)}
            </div>
          </div>
        ))}
      </div>

      <h2>Cycle / strain</h2>
      <div className="metric-grid" style={{ margin: "0.75rem 0 1.5rem" }}>
        {Object.entries(b.cycle).map(([k, v]) => (
          <div className="metric" key={k}>
            <div className="label">{labelFor(k)}</div>
            <div className="value" style={{ fontSize: "1.1rem" }}>
              {formatValue(k, v)}
            </div>
          </div>
        ))}
      </div>

      <h2>Sleep</h2>
      <div className="metric-grid" style={{ margin: "0.75rem 0 1.5rem" }}>
        {Object.entries(b.sleep).map(([k, v]) => (
          <div className="metric" key={k}>
            <div className="label">{labelFor(k)}</div>
            <div className="value" style={{ fontSize: "1.1rem" }}>
              {formatValue(k, v)}
            </div>
          </div>
        ))}
      </div>

      <h2>Workouts</h2>
      <div className="insight-list" style={{ marginTop: "0.75rem" }}>
        {b.workouts.length === 0 && (
          <p className="mono">No workouts in current window.</p>
        )}
        {b.workouts.map((w, i) => (
          <article className="panel" key={`${w.start}-${i}`}>
            <h3>Sport {String(w.sportId)}</h3>
            <p className="mono">
              strain={String(w.strain)} avgHR={String(w.averageHeartRate)} maxHR=
              {String(w.maxHeartRate)} kJ={String(w.kilojoule)}
              {"\n"}
              {String(w.start)} → {String(w.end)}
            </p>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: "2rem" }}>History depth</h2>
      <p className="mono">
        recoveries={b.history.recoveries.length} cycles={b.history.cycles.length}{" "}
        sleeps={b.history.sleeps.length} workouts={b.history.workouts.length}
      </p>

      <div className="toolbar" style={{ marginTop: "1.5rem" }}>
        <a className="btn" href="/api/whoop/auth">
          Connect / refresh WHOOP OAuth
        </a>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={async () => {
            await fetch("/api/whoop/disconnect", { method: "POST" });
            window.location.reload();
          }}
        >
          Disconnect
        </button>
      </div>
    </>
  );
}
