/**
 * Scientific domain associations for Annashakti synthesis.
 * Each link carries an evidence grade so quantum/emerging claims never
 * masquerade as ICMR-NIN established nutrition guidance.
 */

import type { NutrientId } from "@/lib/nutrients/icmr";

export type ScienceDomain =
  | "nutritional_epidemiology"
  | "molecular_biology"
  | "epigenetics"
  | "neurocardiology"
  | "quantum_biology"
  | "chronobiology"
  | "exercise_physiology";

/** A–D evidence ladder used in insight validation. */
export type EvidenceGrade = "A" | "B" | "C" | "D";

export interface BiomarkerNutrientLink {
  id: string;
  biomarker:
    | "recovery_score"
    | "hrv"
    | "resting_hr"
    | "strain"
    | "sleep_performance"
    | "slow_wave"
    | "rem"
    | "spo2"
    | "skin_temp"
    | "respiratory_rate";
  nutrients: NutrientId[];
  domain: ScienceDomain;
  evidence: EvidenceGrade;
  mechanism: string;
  appliedOutcome: string;
  /** Governing / reference framing for the nutrient side. */
  nutrientAuthority: "ICMR-NIN" | "NIH-ODS" | "WHO/FAO" | "FSSAI";
  literatureHint: string;
}

export const SCIENCE_LINKS: BiomarkerNutrientLink[] = [
  {
    id: "hrv-magnesium-neurocardio",
    biomarker: "hrv",
    nutrients: ["magnesium_mg", "omega3_g", "potassium_mg"],
    domain: "neurocardiology",
    evidence: "B",
    mechanism:
      "Magnesium and omega-3 modulate autonomic tone and membrane excitability at the sinoatrial node and central autonomic network, supporting HRV under load.",
    appliedOutcome:
      "When HRV is suppressed, prioritize magnesium-rich millets/greens and omega-3 sources before stimulants.",
    nutrientAuthority: "ICMR-NIN",
    literatureHint:
      "Autonomic nutrition & HRV observational / intervention literature (neurocardiology).",
  },
  {
    id: "recovery-protein-molecular",
    biomarker: "recovery_score",
    nutrients: ["protein_g", "zinc_mg", "vitamin_c_mg"],
    domain: "molecular_biology",
    evidence: "A",
    mechanism:
      "Recovery aggregates tissue repair demand. Amino acids + zinc cofactors drive protein synthesis and antioxidant enzyme systems (SOD/catalase context).",
    appliedOutcome:
      "Low recovery + recent strain → timed dal/egg/paneer protein within the post-load window.",
    nutrientAuthority: "ICMR-NIN",
    literatureHint: "ICMR-NIN protein RDA; exercise recovery molecular pathways.",
  },
  {
    id: "sleep-tryptophan-chrono",
    biomarker: "sleep_performance",
    nutrients: ["tryptophan_mg", "magnesium_mg", "vitamin_b12_ug", "choline_mg"],
    domain: "chronobiology",
    evidence: "B",
    mechanism:
      "Tryptophan → serotonin → melatonin cascade, with magnesium as GABA-ergic cofactor and B12/choline supporting methylation and acetylcholine tone for sleep architecture.",
    appliedOutcome:
      "Poor sleep performance → evening tryptophan + magnesium pattern (curd, banana, sesame) without late caffeine.",
    nutrientAuthority: "ICMR-NIN",
    literatureHint: "Chrononutrition and sleep precursor pathways.",
  },
  {
    id: "sws-glycogen-exercise",
    biomarker: "slow_wave",
    nutrients: ["carbohydrate_g", "magnesium_mg", "potassium_mg"],
    domain: "exercise_physiology",
    evidence: "B",
    mechanism:
      "Slow-wave sleep depth couples to prior glycogen depletion and overnight metabolic restoration; carbs + electrolytes support SWS rebound after high strain.",
    appliedOutcome:
      "High strain day with low SWS → evening complex carbs (ragi/rice) + potassium fluids.",
    nutrientAuthority: "ICMR-NIN",
    literatureHint: "Sleep stage × training load physiology.",
  },
  {
    id: "rem-choline-neuro",
    biomarker: "rem",
    nutrients: ["choline_mg", "omega3_g"],
    domain: "molecular_biology",
    evidence: "C",
    mechanism:
      "REM densification relates to cholinergic tone and membrane phospholipid remodeling; choline and DHA support synaptic membrane dynamics.",
    appliedOutcome:
      "Low REM share → egg yolk / soy choline and flax/fish omega-3 across the day.",
    nutrientAuthority: "NIH-ODS",
    literatureHint: "Cholinergic REM regulation; membrane lipid nutrition.",
  },
  {
    id: "strain-iron-oxygen",
    biomarker: "strain",
    nutrients: ["iron_mg", "vitamin_c_mg", "energy_kcal"],
    domain: "molecular_biology",
    evidence: "A",
    mechanism:
      "Strain reflects cardiovascular work. Iron status governs oxygen delivery; vitamin C enhances non-heme iron absorption common in Indian plant-forward diets.",
    appliedOutcome:
      "Sustained high strain with fatigue → iron + vitamin C pairing (ragi/greens + amla) and adequate energy.",
    nutrientAuthority: "ICMR-NIN",
    literatureHint: "ICMR-NIN iron RDA; exercise hematology.",
  },
  {
    id: "rhr-polyphenol-redox",
    biomarker: "resting_hr",
    nutrients: ["polyphenols_mg", "omega3_g", "potassium_mg"],
    domain: "neurocardiology",
    evidence: "B",
    mechanism:
      "Elevated resting HR under recovery stress tracks sympathetic drive and vascular tone; polyphenols and omega-3 participate in endothelial NO and inflammatory resolution pathways.",
    appliedOutcome:
      "Elevated RHR → anti-inflammatory kitchen pattern (haldi, greens, flax) and fluid/electrolyte restoration.",
    nutrientAuthority: "WHO/FAO",
    literatureHint: "Dietary polyphenols & cardiovascular autonomic markers.",
  },
  {
    id: "hrv-epigenetic-folate",
    biomarker: "hrv",
    nutrients: ["folate_ug", "vitamin_b12_ug", "zinc_mg"],
    domain: "epigenetics",
    evidence: "C",
    mechanism:
      "One-carbon nutrients (folate, B12) and zinc are cofactors in methylation cycles that modulate stress-responsive gene expression over days–weeks — not acute HRV flips.",
    appliedOutcome:
      "Chronic low HRV trend → ensure folate/B12 adequacy (greens, curd/eggs) as a multi-day foundation, not a same-hour fix.",
    nutrientAuthority: "ICMR-NIN",
    literatureHint:
      "Nutritional epigenetics of stress/methylation; applied cautiously with temporal lag.",
  },
  {
    id: "spo2-iron-oxy",
    biomarker: "spo2",
    nutrients: ["iron_mg", "vitamin_c_mg"],
    domain: "molecular_biology",
    evidence: "B",
    mechanism:
      "Peripheral SpO2 dips can reflect sleep breathing or hemoglobin context; iron status is a prerequisite for oxygen-carrying capacity.",
    appliedOutcome:
      "Low SpO2 with fatigue → evaluate iron-rich intake and sleep environment; not a solo food fix for apnea.",
    nutrientAuthority: "ICMR-NIN",
    literatureHint: "Hemoglobin–oxygen transport; sleep SpO2 caveats.",
  },
  {
    id: "skin-temp-hydration",
    biomarker: "skin_temp",
    nutrients: ["potassium_mg", "magnesium_mg", "energy_kcal"],
    domain: "exercise_physiology",
    evidence: "C",
    mechanism:
      "Skin temperature shifts with circadian phase, illness, and heat load; electrolyte and energy availability support thermoregulatory resilience.",
    appliedOutcome:
      "Elevated skin temp after load → coconut water / banana potassium pattern and cool-down nutrition, watch for illness confounders.",
    nutrientAuthority: "WHO/FAO",
    literatureHint: "Thermoregulation & electrolyte physiology.",
  },
  {
    id: "quantum-photosystem-polyphenol",
    biomarker: "recovery_score",
    nutrients: ["polyphenols_mg", "vitamin_c_mg"],
    domain: "quantum_biology",
    evidence: "D",
    mechanism:
      "Quantum biology describes coherent energy transfer in photosynthetic systems and radical-pair magnetoreception. Dietary polyphenols participate in classical redox networks that *echo* those electron-transfer themes — this is analogy + emerging research, not clinical quantum therapy.",
    appliedOutcome:
      "Use plant polyphenol diversity (amla, turmeric, greens) as evidence-backed antioxidants; treat 'quantum' framing as research horizon, never as primary clinical justification.",
    nutrientAuthority: "WHO/FAO",
    literatureHint:
      "Quantum biology reviews (photosynthesis, radical pairs); keep separated from A/B nutrition claims.",
  },
  {
    id: "respiratory-magnesium",
    biomarker: "respiratory_rate",
    nutrients: ["magnesium_mg", "omega3_g"],
    domain: "neurocardiology",
    evidence: "C",
    mechanism:
      "Overnight respiratory rate couples to autonomic and inflammatory state; magnesium and omega-3 support smooth muscle and inflammatory tone.",
    appliedOutcome:
      "Elevated respiratory rate with poor recovery → magnesium + omega-3 pattern and breathing/load review.",
    nutrientAuthority: "ICMR-NIN",
    literatureHint: "Sleep respiratory rate as autonomic proxy.",
  },
];

export const DOMAIN_COPY: Record<
  ScienceDomain,
  { title: string; blurb: string }
> = {
  nutritional_epidemiology: {
    title: "Nutritional epidemiology",
    blurb: "Population RDA/EAR from ICMR-NIN and allied governing bodies.",
  },
  molecular_biology: {
    title: "Molecular biology",
    blurb: "Enzyme cofactors, oxygen transport, membrane and protein synthesis.",
  },
  epigenetics: {
    title: "Epigenetics",
    blurb:
      "Methylation and stress-responsive gene regulation — multi-day effects.",
  },
  neurocardiology: {
    title: "Neurocardiology",
    blurb: "Heart–brain autonomic coupling via HRV, RHR, and vascular tone.",
  },
  quantum_biology: {
    title: "Quantum biology (applied horizon)",
    blurb:
      "Electron-transfer and coherence themes in living systems — marked as emerging.",
  },
  chronobiology: {
    title: "Chronobiology",
    blurb: "Circadian timing of precursors that shape sleep architecture.",
  },
  exercise_physiology: {
    title: "Exercise physiology",
    blurb: "Strain, glycogen, thermoregulation, and recovery windows.",
  },
};
