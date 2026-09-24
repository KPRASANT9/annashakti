import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-visual" aria-hidden />
        <div className="hero-copy">
          <h1 className="hero-brand">
            Anna<em>shakti</em>
          </h1>
          <p className="hero-line">
            Precision nourishment guided by WHOOP biomarkers — for balance and
            clarity under load.
          </p>
          <p className="hero-support">
            Runtime curation of recovery, HRV, strain, and sleep, synthesized
            with ICMR-NIN nutrient science across molecular biology,
            neurocardiology, epigenetics, and applied research horizons.
          </p>
          <div className="cta-row">
            <Link className="btn" href="/lab">
              Open synthesis lab
            </Link>
            <Link className="btn btn-ghost" href="/whoop">
              Inspect WHOOP metrics
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>One loop: biomarker → nutrient → validation</h2>
        <p className="lead">
          Built from the Food Tech brief — guide nourishment with rock-solid
          science, organic supply alignment, and a cybernetic feedback loop that
          captures behavior under real daily load.
        </p>
        <div className="split">
          <div className="panel">
            <h3>WHOOP at runtime</h3>
            <p>
              Recovery, HRV, resting HR, SpO₂, skin temp, cycle strain, sleep
              stages, and workouts — exposed as a curated biomarker bundle for
              synthesis.
            </p>
          </div>
          <div className="panel">
            <h3>ICMR-NIN + governing bodies</h3>
            <p>
              Nutrient targets and Indian kitchen sources anchored to ICMR-NIN
              RDA/EAR, with NIH-ODS and WHO/FAO where needed — never free-floating
              claims.
            </p>
          </div>
          <div className="panel">
            <h3>Scientific domains</h3>
            <p>
              Associations span molecular biology, neurocardiology, chronobiology,
              epigenetics, and quantum biology — each graded A–D so emerging
              ideas cannot override established nutrition science.
            </p>
          </div>
          <div className="panel">
            <h3>Insight validation</h3>
            <p>
              Every synthesized insight is scored for evidence floor, governing
              body anchor, biomarker presence, and daily lifecycle fit before it
              guides the plate.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
