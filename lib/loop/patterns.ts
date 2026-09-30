/**
 * Slice B — cookable thali patterns in home-cook language.
 * Portions use kitchen measures (katori, roti, tsp) not lab grams first.
 */

export type PatternId =
  | "high_strain"
  | "low_recovery"
  | "poor_sleep"
  | "balanced"
  | "mixed_load";

export type CookItem = {
  name: string;
  /** What to put on the counter — cook language */
  amount: string;
  /** Optional gram hint for the lab-minded */
  gramsHint?: number;
  how: string;
};

export type ThaliPattern = {
  id: PatternId;
  title: string;
  /** When this pattern fires */
  when: string;
  /** One line a cook understands */
  intent: string;
  /** Soft biomarker gates used by resolver */
  match: {
    minStrain?: number;
    maxRecovery?: number;
    maxSleep?: number;
    /** Prefer when nothing extreme matches */
    fallback?: boolean;
    mixed?: boolean;
  };
  items: CookItem[];
  steps: string[];
  avoid: string[];
  timing: string;
};

export const THALI_PATTERNS: ThaliPattern[] = [
  {
    id: "high_strain",
    title: "High strain day",
    when: "You trained hard or the day ran hot (strain up).",
    intent: "Fill the tank and rebuild — carbs + dal + a little fat.",
    match: { minStrain: 14 },
    items: [
      {
        name: "Ragi roti",
        amount: "2–3 rotis",
        gramsHint: 120,
        how: "Warm on tawa. Soft is fine — no need for crisp.",
      },
      {
        name: "Moong dal",
        amount: "1 full katori (cooked)",
        gramsHint: 180,
        how: "Simple tadka: jeera, hing, turmeric, ghee or groundnut oil.",
      },
      {
        name: "Banana or jaggery bit",
        amount: "1 small banana or 1 tsp jaggery",
        how: "After the meal if you still feel empty.",
      },
      {
        name: "Curd",
        amount: "½ katori",
        gramsHint: 80,
        how: "Plain dahi on the side.",
      },
    ],
    steps: [
      "Put dal on to simmer first.",
      "Roll rotis while dal cooks.",
      "Tadka at the end — don’t burn the jeera.",
      "Eat within an hour of finishing training if you can.",
    ],
    avoid: ["Skipping the roti", "Only salad", "Late heavy fried snacks"],
    timing: "Main plate after training or by early evening.",
  },
  {
    id: "low_recovery",
    title: "Low recovery day",
    when: "Body feels wrung out (recovery low).",
    intent: "Repair gently — iron + vitamin C pairing, easy protein, no heroics.",
    match: { maxRecovery: 55 },
    items: [
      {
        name: "Ragi roti or soft rice",
        amount: "2 rotis or 1 katori rice",
        gramsHint: 100,
        how: "Keep it soft and warm.",
      },
      {
        name: "Moong or toor dal",
        amount: "1 katori",
        gramsHint: 160,
        how: "Thin dal is fine today — easy to digest.",
      },
      {
        name: "Amla",
        amount: "1 amla, grated or chopped — or 1 tbsp amla pickle/chutney",
        gramsHint: 40,
        how: "With the meal so iron from greens/roti lands better.",
      },
      {
        name: "Palak or other greens",
        amount: "1 small bowl sabzi",
        how: "Lightly cooked with garlic and a squeeze of lemon.",
      },
    ],
    steps: [
      "Cook dal thin.",
      "Greens quick-sauté — don’t overboil.",
      "Amla or lemon with the plate.",
      "Early dinner. Short walk if you feel up to it — no extra strain.",
    ],
    avoid: ["Max effort workouts", "Skipping food to ‘feel light’", "Too much coffee"],
    timing: "Calm dinner. Protect sleep after.",
  },
  {
    id: "poor_sleep",
    title: "Poor sleep night",
    when: "Sleep was thin or broken.",
    intent: "Evening plate that settles — warm, not spicy-late, magnesium-friendly.",
    match: { maxSleep: 70 },
    items: [
      {
        name: "Warm haldi doodh or light curd",
        amount: "1 glass milk with pinch turmeric + black pepper, or ½ katori curd",
        how: "Not boiling hot. Sip slow.",
      },
      {
        name: "Ragi or soft roti",
        amount: "1–2 rotis",
        gramsHint: 80,
        how: "Small plate — don’t go to bed stuffed.",
      },
      {
        name: "Moong dal or khichdi",
        amount: "¾ katori",
        gramsHint: 140,
        how: "Mild tadka only.",
      },
      {
        name: "Banana",
        amount: "½–1 banana",
        how: "Optional, earlier in the evening.",
      },
    ],
    steps: [
      "Finish the main plate 2–3 hours before bed if you can.",
      "Keep chilli and deep-fry for another day.",
      "Haldi doodh as the last thing.",
      "Phone down after the glass.",
    ],
    avoid: ["Late biryani", "Extra caffeine after noon", "Doomscrolling in bed"],
    timing: "Early, warm, quiet evening plate.",
  },
  {
    id: "balanced",
    title: "Balanced day",
    when: "Recovery okay, strain moderate, sleep decent.",
    intent: "Steady thali — millet, dal, curd, one green. Nothing fancy.",
    match: { fallback: true },
    items: [
      {
        name: "Ragi or jowar roti",
        amount: "2 rotis",
        gramsHint: 100,
        how: "As you usually make them.",
      },
      {
        name: "Dal of the house",
        amount: "1 katori",
        gramsHint: 160,
        how: "Your normal tadka.",
      },
      {
        name: "Seasonal sabzi",
        amount: "1 bowl",
        how: "Whatever is fresh — onion, tomato, greens.",
      },
      {
        name: "Curd",
        amount: "½ katori",
        gramsHint: 80,
        how: "Plain.",
      },
    ],
    steps: [
      "Cook as a normal home thali.",
      "Sit and eat — don’t stand at the counter.",
      "Leave a little room; no need to finish every grain.",
    ],
    avoid: ["Turning a good day into a feast by default"],
    timing: "Lunch or dinner — your usual hour.",
  },
  {
    id: "mixed_load",
    title: "Mixed load day",
    when: "Some strain, recovery not great — selective nourishment.",
    intent: "Support without overloading — vitamin C + grain + dal + small seed fat.",
    match: { mixed: true },
    items: [
      {
        name: "Amla",
        amount: "1 amla (grated) or 1 tbsp amla",
        gramsHint: 50,
        how: "With the first bites of the meal.",
      },
      {
        name: "Ragi roti",
        amount: "2 rotis",
        gramsHint: 100,
        how: "Warm.",
      },
      {
        name: "Moong dal",
        amount: "1 katori",
        gramsHint: 160,
        how: "Medium consistency, light tadka.",
      },
      {
        name: "Flaxseed (alsi)",
        amount: "1 tsp freshly ground",
        gramsHint: 8,
        how: "Sprinkle on dal or curd — don’t heat hard.",
      },
    ],
    steps: [
      "Dal and roti as the base.",
      "Amla first or with greens.",
      "Alsi on top at the end.",
      "Stop when comfortably full.",
    ],
    avoid: ["Another hard session tonight", "Skipping the amla ‘because small’"],
    timing: "Dinner after the day’s load.",
  },
];

export function resolvePattern(input: {
  recovery: number | null;
  strain: number | null;
  sleepPerformance: number | null;
}): ThaliPattern {
  const recovery = input.recovery;
  const strain = input.strain;
  const sleep = input.sleepPerformance;

  if (sleep != null && sleep < 70) {
    return THALI_PATTERNS.find((p) => p.id === "poor_sleep")!;
  }
  if (recovery != null && recovery < 55) {
    return THALI_PATTERNS.find((p) => p.id === "low_recovery")!;
  }
  if (strain != null && strain >= 14) {
    return THALI_PATTERNS.find((p) => p.id === "high_strain")!;
  }
  if (
    (recovery != null && recovery < 67 && recovery >= 55) ||
    (strain != null && strain >= 10 && strain < 14)
  ) {
    return THALI_PATTERNS.find((p) => p.id === "mixed_load")!;
  }
  return THALI_PATTERNS.find((p) => p.id === "balanced")!;
}

export type CookableThali = {
  pattern: ThaliPattern;
  /** Kitchen headline */
  headline: string;
  /** Body context in plain words — no WHOOP jargon required */
  whyTonight: string;
  items: CookItem[];
  steps: string[];
  avoid: string[];
  timing: string;
  /** Lab foods if composed (optional overlay) */
  composedNote: string | null;
  sharePayload: ShareableThali;
};

export type ShareableThali = {
  v: 1;
  date: string;
  patternId: PatternId;
  headline: string;
  whyTonight: string;
  items: CookItem[];
  steps: string[];
  avoid: string[];
  timing: string;
  recovery: number | null;
  strain: number | null;
  sleepPerformance: number | null;
  kitchenLabel?: string;
};

export function buildCookableThali(input: {
  date: string;
  recovery: number | null;
  strain: number | null;
  sleepPerformance: number | null;
  loadLabel?: string;
  composedFoods?: Array<{ foodName: string; grams: number }>;
  patternId?: PatternId;
  kitchenLabel?: string;
}): CookableThali {
  const pattern =
    THALI_PATTERNS.find((p) => p.id === input.patternId) ??
    resolvePattern(input);

  const whyBits: string[] = [pattern.when];
  if (input.recovery != null) whyBits.push(`Recovery felt like ${input.recovery}.`);
  if (input.strain != null)
    whyBits.push(`Day strain about ${Number(input.strain).toFixed(1)}.`);
  if (input.sleepPerformance != null)
    whyBits.push(`Sleep score about ${input.sleepPerformance}.`);

  let composedNote: string | null = null;
  if (input.composedFoods?.length) {
    composedNote =
      "From today’s lab composition (same spirit as this pattern): " +
      input.composedFoods
        .map((f) => `${f.foodName} ~${f.grams}g`)
        .join(", ") +
      ".";
  }

  const headline = `Tonight’s thali — ${pattern.title}`;
  const whyTonight = whyBits.join(" ");

  const sharePayload: ShareableThali = {
    v: 1,
    date: input.date,
    patternId: pattern.id,
    headline,
    whyTonight,
    items: pattern.items,
    steps: pattern.steps,
    avoid: pattern.avoid,
    timing: pattern.timing,
    recovery: input.recovery,
    strain: input.strain,
    sleepPerformance: input.sleepPerformance,
    kitchenLabel: input.kitchenLabel,
  };

  return {
    pattern,
    headline,
    whyTonight,
    items: pattern.items,
    steps: pattern.steps,
    avoid: pattern.avoid,
    timing: pattern.timing,
    composedNote,
    sharePayload,
  };
}

function toBase64Url(json: string): string {
  // Prefer browser-safe path — Next may polyfill Buffer without base64url.
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return Buffer.from(json, "utf8").toString("base64url");
}

function fromBase64Url(token: string): string {
  const pad = token.length % 4 === 0 ? "" : "=".repeat(4 - (token.length % 4));
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(token, "base64url").toString("utf8");
}

export function encodeShare(payload: ShareableThali): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeShare(token: string): ShareableThali | null {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as ShareableThali;
    if (parsed?.v !== 1 || !parsed.patternId) return null;
    return parsed;
  } catch {
    return null;
  }
}
