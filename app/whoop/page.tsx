import { WhoopMetricsPanel } from "@/components/WhoopMetricsPanel";

export default function WhoopPage() {
  return (
    <>
      <header className="lab-header">
        <h1>WHOOP metrics</h1>
        <p>
          All exposed runtime biomarkers from your WHOOP integration. Demo
          fixtures load when OAuth credentials or tokens are not present — flip
          to live by setting WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET or
          WHOOP_ACCESS_TOKEN.
        </p>
      </header>
      <section className="section" style={{ paddingTop: "0.5rem" }}>
        <WhoopMetricsPanel />
      </section>
    </>
  );
}
