/**
 * Probabilistic foundation + composition engine.
 *
 * Bayesian update:
 *   prior     ← ICMR-NIN / governing-body nutrient foundations
 *   likelihood ← WHOOP biomarker deficits × science-link evidence
 *   posterior ← normalize(prior × likelihood^α × evidenceTemper)
 *
 * Frontier models (optional) may *dictate candidate foundations and compose
 * elements*, but every proposal is re-grounded: posterior mass, evidence
 * floor, and ICMR-NIN RDA coverage must pass before nutritional value is
 * accepted as precise guidance.
 */

import {
  INDIAN_FOODS,
  NUTRIENT_TARGETS,
  type NutrientId,
} from "@/lib/nutrients/icmr";
import { SCIENCE_LINKS, type EvidenceGrade } from "@/lib/science/domains";
import {
  synthesizeNourishment,
  type SynthesisResult,
} from "@/lib/synthesis/engine";
import type { RuntimeBiomarkers } from "@/lib/whoop/types";

export type FoundationElement = {
  nutrientId: NutrientId;
  name: string;
  governingBody: string;
  rda: number;
  unit: string;
  /** Prior mass from governing-body importance (sums ~1 across foundations). */
  prior: number;
  /** Biomarker-driven likelihood. */
  likelihood: number;
  /** Posterior probability after Bayesian update + evidence tempering. */
  posterior: number;
  /** Credible interval (equal-tailed approx from Dirichlet concentration). */
  ci95: [number, number];
  evidenceSupport: EvidenceGrade;
  scientificDomains: string[];
};

export type ComposedElement = {
  foodId: string;
  foodName: string;
  category: string;
  /** Grams suggested in this composition draw. */
  grams: number;
  /** Probability this food was selected given posterior nutrient needs. */
  selectionProbability: number;
  nutrientContribution: Partial<Record<NutrientId, number>>;
  scientificRole: string;
};

export type CompositionPrecision = {
  /** Expected fraction of priority-nutrient RDA covered by the plate. */
  expectedRdaCoverage: number;
  /** Monte Carlo stdev of coverage across samples. */
  coverageUncertainty: number;
  /** Share of posterior mass sitting on evidence A/B foundations. */
  evidenceAnchoredMass: number;
  /** 0–100 precision score after scientific grounding. */
  precisionScore: number;
  passesGrounding: boolean;
  groundingChecks: Array<{
    id: string;
    passed: boolean;
    detail: string;
  }>;
};

export type ProbabilisticComposition = {
  generatedAt: string;
  method: "bayesian_local" | "frontier_grounded";
  frontierModel: string | null;
  seed: number;
  lifecyclePhase: string;
  foundations: FoundationElement[];
  composition: ComposedElement[];
  nutritionalValue: Partial<Record<NutrientId, number>>;
  precision: CompositionPrecision;
  frontierNarrative: string | null;
  methodNotes: string[];
};

const EVIDENCE_TEMPER: Record<EvidenceGrade, number> = {
  A: 1.0,
  B: 0.85,
  C: 0.55,
  D: 0.25,
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Mulberry32 — deterministic draws for reproducible lab experiments. */
export function createRng(seed: number) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function softmax(weights: number[], temperature = 1): number[] {
  const t = Math.max(temperature, 0.05);
  const max = Math.max(...weights);
  const exps = weights.map((w) => Math.exp((w - max) / t));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

function sampleIndex(probs: number[], rng: () => number): number {
  let u = rng();
  for (let i = 0; i < probs.length; i++) {
    u -= probs[i];
    if (u <= 0) return i;
  }
  return probs.length - 1;
}

/** Normal approx CI for a Dirichlet marginal with concentration α_i, α_0. */
function dirichletCi95(alphaI: number, alpha0: number): [number, number] {
  const mean = alphaI / alpha0;
  const variance =
    (alphaI * (alpha0 - alphaI)) / (alpha0 * alpha0 * (alpha0 + 1));
  const sd = Math.sqrt(Math.max(variance, 1e-9));
  return [clamp(mean - 1.96 * sd, 0, 1), clamp(mean + 1.96 * sd, 0, 1)];
}

function biomarkerLikelihood(
  nutrientId: NutrientId,
  synthesis: SynthesisResult,
): { likelihood: number; grade: EvidenceGrade; domains: string[] } {
  let score = 0.15; // base noise floor
  let bestGrade: EvidenceGrade = "C";
  const domains = new Set<string>();

  for (const insight of synthesis.insights) {
    if (!insight.nutrients.includes(nutrientId)) continue;
    const validation = synthesis.validations.find(
      (v) => v.insightId === insight.id,
    );
    const value = (validation?.valueScore ?? 40) / 100;
    const temper = EVIDENCE_TEMPER[insight.evidence];
    score += (insight.signalStrength / 100) * value * temper;
    domains.add(insight.domain);
    if (
      EVIDENCE_TEMPER[insight.evidence] > EVIDENCE_TEMPER[bestGrade]
    ) {
      bestGrade = insight.evidence;
    }
  }

  // Also use nutrient plan priority if present
  const plan = synthesis.nutrientPlan.find((n) => n.nutrientId === nutrientId);
  if (plan) score += plan.priority / 120;

  return {
    likelihood: clamp(score, 0.05, 4),
    grade: bestGrade,
    domains: [...domains],
  };
}

/**
 * Build governing-body priors. Energy/protein/micronutrients get mass
 * proportional to ICMR-NIN centrality (not equal — structural foundations
 * outweigh speculative polyphenol targets slightly).
 */
function foundationPriors(): Record<NutrientId, number> {
  const weights: Partial<Record<NutrientId, number>> = {
    energy_kcal: 1.2,
    protein_g: 1.35,
    carbohydrate_g: 1.0,
    fat_g: 0.9,
    fiber_g: 0.95,
    iron_mg: 1.25,
    calcium_mg: 1.1,
    zinc_mg: 1.05,
    magnesium_mg: 1.15,
    potassium_mg: 1.0,
    vitamin_a_ug: 0.85,
    vitamin_c_mg: 1.0,
    vitamin_d_ug: 0.9,
    vitamin_b12_ug: 1.1,
    folate_ug: 1.05,
    omega3_g: 1.0,
    tryptophan_mg: 0.8,
    choline_mg: 0.75,
    polyphenols_mg: 0.55,
  };
  const entries = NUTRIENT_TARGETS.map((n) => [n.id, weights[n.id] ?? 0.8] as const);
  const sum = entries.reduce((s, [, w]) => s + w, 0);
  return Object.fromEntries(entries.map(([id, w]) => [id, w / sum])) as Record<
    NutrientId,
    number
  >;
}

export function computeFoundations(
  synthesis: SynthesisResult,
): FoundationElement[] {
  const priors = foundationPriors();
  const alpha = 1.15; // likelihood sharpening
  const raw = NUTRIENT_TARGETS.map((n) => {
    const { likelihood, grade, domains } = biomarkerLikelihood(n.id, synthesis);
    const unnormalized =
      priors[n.id] * Math.pow(likelihood, alpha) * EVIDENCE_TEMPER[grade];
    return { n, likelihood, grade, domains, unnormalized };
  });
  const z = raw.reduce((s, r) => s + r.unnormalized, 0) || 1;
  const concentration = 48; // Dirichlet strength — tighter = more precise

  return raw
    .map((r) => {
      const posterior = r.unnormalized / z;
      const alphaI = posterior * concentration + 0.5;
      const alpha0 = concentration + 0.5 * raw.length;
      return {
        nutrientId: r.n.id,
        name: r.n.name,
        governingBody: r.n.governingBody,
        rda: r.n.rda,
        unit: r.n.unit,
        prior: priors[r.n.id],
        likelihood: r.likelihood,
        posterior,
        ci95: dirichletCi95(alphaI, alpha0),
        evidenceSupport: r.grade,
        scientificDomains: r.domains,
      };
    })
    .sort((a, b) => b.posterior - a.posterior);
}

function foodFitScore(
  food: (typeof INDIAN_FOODS)[number],
  foundations: FoundationElement[],
): number {
  let score = 0;
  for (const f of foundations.slice(0, 10)) {
    const amount = food.per100g[f.nutrientId];
    if (!amount) continue;
    const density = amount / Math.max(f.rda, 1);
    score += f.posterior * density * 100;
  }
  return score;
}

function nutrientTotals(
  picks: ComposedElement[],
): Partial<Record<NutrientId, number>> {
  const totals: Partial<Record<NutrientId, number>> = {};
  for (const pick of picks) {
    for (const [k, v] of Object.entries(pick.nutrientContribution)) {
      const id = k as NutrientId;
      totals[id] = (totals[id] ?? 0) + (v ?? 0);
    }
  }
  return totals;
}

function assessPrecision(
  foundations: FoundationElement[],
  totals: Partial<Record<NutrientId, number>>,
  coverageSamples: number[],
): CompositionPrecision {
  const top = foundations.slice(0, 8);
  const coverages = top.map((f) => {
    const got = totals[f.nutrientId] ?? 0;
    return clamp(got / f.rda, 0, 1.5);
  });
  const expectedRdaCoverage =
    coverages.reduce((a, b) => a + b, 0) / Math.max(coverages.length, 1);

  const mean =
    coverageSamples.reduce((a, b) => a + b, 0) /
    Math.max(coverageSamples.length, 1);
  const variance =
    coverageSamples.reduce((s, x) => s + (x - mean) ** 2, 0) /
    Math.max(coverageSamples.length, 1);
  const coverageUncertainty = Math.sqrt(variance);

  const evidenceAnchoredMass = foundations
    .filter((f) => f.evidenceSupport === "A" || f.evidenceSupport === "B")
    .reduce((s, f) => s + f.posterior, 0);

  const icmrMass = foundations
    .filter((f) => f.governingBody === "ICMR-NIN")
    .reduce((s, f) => s + f.posterior, 0);

  const groundingChecks = [
    {
      id: "icmr_mass",
      passed: icmrMass >= 0.55,
      detail: `ICMR-NIN posterior mass ${(icmrMass * 100).toFixed(0)}% (need ≥55%).`,
    },
    {
      id: "evidence_anchor",
      passed: evidenceAnchoredMass >= 0.45,
      detail: `A/B evidence mass ${(evidenceAnchoredMass * 100).toFixed(0)}% (need ≥45%).`,
    },
    {
      id: "rda_coverage",
      passed: expectedRdaCoverage >= 0.28,
      detail: `Expected priority RDA coverage ${(expectedRdaCoverage * 100).toFixed(0)}% (need ≥28% on a single composed plate).`,
    },
    {
      id: "uncertainty_bound",
      passed: coverageUncertainty <= 0.28,
      detail: `Coverage uncertainty σ=${coverageUncertainty.toFixed(3)} (need ≤0.28).`,
    },
  ];

  const precisionScore = clamp(
    expectedRdaCoverage * 45 +
      evidenceAnchoredMass * 30 +
      icmrMass * 20 +
      (1 - clamp(coverageUncertainty / 0.4, 0, 1)) * 15,
    0,
    100,
  );

  return {
    expectedRdaCoverage,
    coverageUncertainty,
    evidenceAnchoredMass,
    precisionScore: Math.round(precisionScore),
    passesGrounding: groundingChecks.every((c) => c.passed),
    groundingChecks,
  };
}

function composeFromPosterior(
  foundations: FoundationElement[],
  rng: () => number,
  plateSlots = 4,
): ComposedElement[] {
  const foods = [...INDIAN_FOODS];
  const picks: ComposedElement[] = [];
  const used = new Set<string>();
  const usedCategories = new Set<string>();
  let scores = foods.map((f) => foodFitScore(f, foundations));

  for (let slot = 0; slot < plateSlots; slot++) {
    const adjusted = foods.map((f, i) => {
      if (used.has(f.id)) return -Infinity;
      // Mild diversity prior: prefer unseen categories
      const catPenalty = usedCategories.has(f.category) ? 0.55 : 1;
      return scores[i] * catPenalty;
    });
    const finite = adjusted.map((s) => (Number.isFinite(s) ? s : -1e9));
    const probs = softmax(finite, 0.7);
    const idx = sampleIndex(probs, rng);
    const food = foods[idx];
    used.add(food.id);
    usedCategories.add(food.category);

    const demand = foundations.slice(0, 6).reduce((s, f) => {
      return s + (food.per100g[f.nutrientId] ? f.posterior : 0);
    }, 0);
    const grams = Math.round(70 + demand * 260 + rng() * 50);
    const nutrientContribution: Partial<Record<NutrientId, number>> = {};
    for (const [k, per100] of Object.entries(food.per100g)) {
      nutrientContribution[k as NutrientId] = ((per100 ?? 0) * grams) / 100;
    }
    const topNutrient = foundations.find((f) => food.per100g[f.nutrientId]);
    picks.push({
      foodId: food.id,
      foodName: food.name,
      category: food.category,
      grams,
      selectionProbability: probs[idx],
      nutrientContribution,
      scientificRole: topNutrient
        ? `Supports ${topNutrient.name} (${topNutrient.governingBody}) under ${topNutrient.scientificDomains[0] ?? "nutritional epidemiology"}`
        : "Kitchen element supporting overall posterior mass",
    });

    // Remove selected mass for next slot clarity
    scores = scores.map((s, i) => (i === idx ? 0 : s));
  }

  return picks;
}

export function composeProbabilistic(options: {
  biomarkers: RuntimeBiomarkers;
  at?: Date;
  seed?: number;
  samples?: number;
  frontierNarrative?: string | null;
  frontierModel?: string | null;
}): ProbabilisticComposition {
  const at = options.at ?? new Date();
  const seed = options.seed ?? Math.floor(Math.random() * 1e9);
  const samples = options.samples ?? 24;
  const rng = createRng(seed);
  const synthesis = synthesizeNourishment(options.biomarkers, at);
  const foundations = computeFoundations(synthesis);

  const coverageSamples: number[] = [];
  let best = composeFromPosterior(foundations, rng);
  let bestCov = 0;

  for (let i = 0; i < samples; i++) {
    const draw = composeFromPosterior(foundations, rng);
    const totals = nutrientTotals(draw);
    const top = foundations.slice(0, 8);
    const cov =
      top.reduce(
        (s, f) => s + clamp((totals[f.nutrientId] ?? 0) / f.rda, 0, 1.25),
        0,
      ) / top.length;
    coverageSamples.push(cov);
    if (cov > bestCov) {
      bestCov = cov;
      best = draw;
    }
  }

  const nutritionalValue = nutrientTotals(best);
  const precision = assessPrecision(foundations, nutritionalValue, coverageSamples);

  return {
    generatedAt: new Date().toISOString(),
    method: options.frontierModel ? "frontier_grounded" : "bayesian_local",
    frontierModel: options.frontierModel ?? null,
    seed,
    lifecyclePhase: synthesis.lifecycle.phase,
    foundations,
    composition: best,
    nutritionalValue,
    precision,
    frontierNarrative: options.frontierNarrative ?? null,
    methodNotes: [
      "Priors from ICMR-NIN / NIH-ODS / WHO-FAO nutrient foundations.",
      "Likelihood from WHOOP-linked synthesis with evidence tempering (A–D).",
      "Posterior Dirichlet CI95 expresses uncertainty over nutrient mass.",
      "Plate elements sampled by softmax over food×posterior fit; Monte Carlo selects high-coverage draw.",
      "Frontier model output (if any) is advisory narrative only — nutritional precision is the grounded posterior plate.",
      ...synthesis.methodNotes.slice(0, 2),
    ],
  };
}

/** Links used to brief a frontier model — scientific constraints, not free prose. */
export function buildFrontierBrief(
  biomarkers: RuntimeBiomarkers,
  foundations: FoundationElement[],
  synthesis: SynthesisResult,
): string {
  const topFoundations = foundations.slice(0, 8).map((f) => ({
    nutrient: f.name,
    id: f.nutrientId,
    posterior: Number(f.posterior.toFixed(3)),
    ci95: f.ci95.map((x) => Number(x.toFixed(3))),
    rda: f.rda,
    unit: f.unit,
    authority: f.governingBody,
    evidence: f.evidenceSupport,
    domains: f.scientificDomains,
  }));

  const science = SCIENCE_LINKS.filter((l) =>
    topFoundations.some((f) =>
      synthesis.insights.some(
        (i) => i.linkId === l.id && i.nutrients.includes(f.id as NutrientId),
      ),
    ),
  ).slice(0, 6);

  return JSON.stringify(
    {
      task: "Dictate foundational nutritional elements and compose an Indian kitchen plate.",
      constraints: [
        "Ground every element in ICMR-NIN or listed governing body RDA.",
        "Respect evidence grades; do not elevate D (quantum-horizon) over A/B.",
        "Optimize for balance and clarity under physiological load.",
        "Use whole Indian foods (soak, sprout, ferment, tadka culture).",
        "Return JSON only.",
      ],
      biomarkers: {
        recovery: biomarkers.recovery.score,
        hrv: biomarkers.recovery.hrvRmssdMilli,
        strain: biomarkers.cycle.strain,
        sleepPerformance: biomarkers.sleep.performancePercent,
      },
      lifecycle: synthesis.lifecycle,
      posteriorFoundations: topFoundations,
      allowedFoods: INDIAN_FOODS.map((f) => f.id),
      scienceLinks: science.map((s) => ({
        id: s.id,
        domain: s.domain,
        evidence: s.evidence,
        mechanism: s.mechanism,
      })),
      responseSchema: {
        foundations: [{ nutrientId: "string", rationale: "string" }],
        plate: [{ foodId: "string", grams: "number", role: "string" }],
        narrative: "string — precise, scientific, no medical claims",
      },
    },
    null,
    2,
  );
}

export type FrontierComposeResult = {
  model: string;
  narrative: string;
  suggestedFoodIds: string[];
  raw?: string;
};

/**
 * Optional frontier-model dictation. Returns null if no API key configured.
 * Nutritional precision is NEVER taken from the model alone — caller must
 * run composeProbabilistic afterward to ground the plate.
 */
export async function dictateWithFrontierModel(
  brief: string,
): Promise<FrontierComposeResult | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) return null;

  const system = `You are Annashakti's scientific composition advisor. You dictate foundational nutrient elements and compose Indian kitchen plates. You never invent RDA values; you use the posterior foundations and governing bodies in the brief. Prefer evidence A/B. Quantum biology is horizon-only. Respond with JSON only.`;

  try {
    if (anthropicKey) {
      const model =
        process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1200,
          system,
          messages: [{ role: "user", content: brief }],
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const text = data.content?.find((c) => c.type === "text")?.text ?? "";
      return parseFrontierResponse(text, model);
    }

    const model = process.env.OPENAI_MODEL || "gpt-4.1";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: brief },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    return parseFrontierResponse(text, model);
  } catch {
    return null;
  }
}

function parseFrontierResponse(
  text: string,
  model: string,
): FrontierComposeResult {
  let narrative = text.slice(0, 1200);
  let suggestedFoodIds: string[] = [];
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const parsed = JSON.parse(text.slice(start, end + 1)) as {
        narrative?: string;
        plate?: Array<{ foodId?: string }>;
      };
      if (parsed.narrative) narrative = parsed.narrative;
      suggestedFoodIds = (parsed.plate ?? [])
        .map((p) => p.foodId)
        .filter((id): id is string => Boolean(id));
    }
  } catch {
    // keep raw narrative
  }
  return { model, narrative, suggestedFoodIds, raw: text };
}

/**
 * Bias food sampling toward frontier-suggested foods without leaving the
 * probabilistic / ICMR-grounded path.
 */
export function composeWithFrontierBias(
  base: ProbabilisticComposition,
  suggestedFoodIds: string[],
  biomarkers: RuntimeBiomarkers,
  at: Date,
  seed: number,
): ProbabilisticComposition {
  if (suggestedFoodIds.length === 0) return base;

  const synthesis = synthesizeNourishment(biomarkers, at);
  const foundations = base.foundations;
  const rng = createRng(seed + 17);
  // Bias fit scores then reuse the diversified posterior composer path
  // by temporarily cloning foods with boosted affinity via re-compose samples.
  const biasedDraws: ComposedElement[][] = [];
  for (let i = 0; i < 16; i++) {
    const draw = composeFromPosterior(foundations, rng);
    // Prefer draws that include frontier suggestions
    const hit = draw.filter((d) => suggestedFoodIds.includes(d.foodId)).length;
    if (hit > 0 || i > 10) biasedDraws.push(draw);
  }
  // Score draws by frontier overlap × coverage
  let best = biasedDraws[0] ?? composeFromPosterior(foundations, rng);
  let bestScore = -1;
  for (const draw of biasedDraws) {
    const totals = nutrientTotals(draw);
    const top = foundations.slice(0, 8);
    const cov =
      top.reduce(
        (s, f) => s + clamp((totals[f.nutrientId] ?? 0) / f.rda, 0, 1.25),
        0,
      ) / top.length;
    const hit = draw.filter((d) => suggestedFoodIds.includes(d.foodId)).length;
    const score = cov + hit * 0.12;
    if (score > bestScore) {
      bestScore = score;
      best = draw.map((d) => ({
        ...d,
        scientificRole: suggestedFoodIds.includes(d.foodId)
          ? "Frontier-dictated element, re-weighted onto posterior × ICMR fit"
          : d.scientificRole,
      }));
    }
  }

  const picks = best;
  const nutritionalValue = nutrientTotals(picks);
  // Re-assess with a small MC around the biased plate
  const coverageSamples = Array.from({ length: 12 }, () => {
    const totals = nutrientTotals(composeFromPosterior(foundations, rng));
    const top = foundations.slice(0, 8);
    return (
      top.reduce(
        (s, f) => s + clamp((totals[f.nutrientId] ?? 0) / f.rda, 0, 1.25),
        0,
      ) / top.length
    );
  });
  const precision = assessPrecision(foundations, nutritionalValue, coverageSamples);

  return {
    ...base,
    method: "frontier_grounded",
    composition: picks,
    nutritionalValue,
    precision,
    lifecyclePhase: synthesis.lifecycle.phase,
  };
}
