import { DOMAIN_COPY, SCIENCE_LINKS } from "@/lib/science/domains";
import { NUTRIENT_TARGETS } from "@/lib/nutrients/icmr";

export default function SciencePage() {
  return (
    <>
      <header className="lab-header">
        <h1>Scientific approach</h1>
        <p>
          How Annashakti synthesizes nutrient information from ICMR-NIN and
          allied governing bodies with biomarker associations drawn from
          molecular biology, neurocardiology, epigenetics, chronobiology,
          exercise physiology, and quantum biology — with explicit evidence
          grades.
        </p>
      </header>

      <section className="section" style={{ paddingTop: "0.5rem" }}>
        <h2>Domains in play</h2>
        <p className="lead">
          Real-world value is observed as applied science. Speculative layers
          stay labeled and cannot outrank A/B evidence in the validation gate.
        </p>
        <div className="split">
          {Object.entries(DOMAIN_COPY).map(([id, copy]) => (
            <article className="panel" key={id}>
              <h3>{copy.title}</h3>
              <p>{copy.blurb}</p>
            </article>
          ))}
        </div>

        <h2 style={{ marginTop: "3rem" }}>Biomarker ↔ nutrient links</h2>
        <p className="lead">
          Each link states mechanism, applied outcome, nutrient authority, and
          evidence grade (A–D).
        </p>
        <div className="insight-list">
          {SCIENCE_LINKS.map((link) => (
            <article className="insight" key={link.id}>
              <header>
                <h4>
                  {link.biomarker.replaceAll("_", " ")} · {link.domain.replaceAll("_", " ")}
                </h4>
                <span className={`badge badge-${link.evidence.toLowerCase()}`}>
                  {link.evidence}
                </span>
                <span className="badge">{link.nutrientAuthority}</span>
              </header>
              <p>{link.mechanism}</p>
              <p>{link.appliedOutcome}</p>
              <p className="mono">
                nutrients: {link.nutrients.join(", ")}
                {"\n"}
                {link.literatureHint}
              </p>
            </article>
          ))}
        </div>

        <h2 style={{ marginTop: "3rem" }}>Probabilistic + frontier composition</h2>
        <p className="lead">
          Nutrient foundations carry ICMR-NIN priors. WHOOP-linked likelihood
          updates them into posteriors with evidence tempering (A–D). Frontier
          models may dictate candidate elements; every plate is re-sampled and
          grounded before precision is accepted. See{" "}
          <a href="/lab" style={{ color: "var(--brass)" }}>
            Synthesis lab
          </a>
          .
        </p>
        <div className="split">
          <article className="panel">
            <h3>Bayesian foundations</h3>
            <p>
              posterior ∝ prior × likelihood^α × evidenceTemper — with Dirichlet
              CI95 so uncertainty is visible, not hidden.
            </p>
          </article>
          <article className="panel">
            <h3>Frontier dictation</h3>
            <p>
              Optional OpenAI / Anthropic call proposes foundations and plate
              JSON. Nutritional value never comes from the model alone — the
              probabilistic grounder has the last word.
            </p>
          </article>
        </div>

        <h2 style={{ marginTop: "3rem" }}>ICMR-NIN nutrient anchors</h2>
        <p className="lead">
          Adult moderate-activity reference set used by the synthesis engine
          (experimentation baseline for Indian kitchen patterns).
        </p>
        <div className="insight-list">
          {NUTRIENT_TARGETS.map((n) => (
            <article className="panel" key={n.id}>
              <h3>
                {n.name}{" "}
                <span className="badge">
                  RDA {n.rda}
                  {n.unit}
                </span>
              </h3>
              <p>
                {n.governingBody}
                {n.ear != null ? ` · EAR ${n.ear}${n.unit}` : ""}
              </p>
              <p>{n.role}</p>
              <div className="food-chips">
                {n.indianFoodSources.map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
