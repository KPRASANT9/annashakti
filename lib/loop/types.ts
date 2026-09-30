/** Slice A — daily Lift → Plate → Sleep practice log. */

export type LoopPlateItem = {
  foodId: string;
  foodName: string;
  grams: number;
  category: string;
};

export type LoopEntry = {
  id: string;
  /** Local calendar date YYYY-MM-DD */
  date: string;
  createdAt: string;
  updatedAt: string;
  source: "whoop_live" | "whoop_demo";
  recovery: number | null;
  hrv: number | null;
  strain: number | null;
  sleepPerformance: number | null;
  clarityUnderLoad: number | null;
  loadLabel: string;
  lifecyclePhase: string;
  plate: LoopPlateItem[];
  /** One sentence a home cook can follow. */
  thaliSentence: string;
  precisionScore: number;
  grounded: boolean;
  composeMethod: string;
  seed: number;
  /** Did you cook this plate? */
  cooked: boolean;
  cookedAt: string | null;
  /**
   * Next-morning clarity under load, 1–5.
   * Fill the day after you cooked.
   */
  clarityNextDay: number | null;
  clarityNote: string | null;
  status: "accepted" | "cooked" | "reviewed";
};

export type LoopSnapshot = {
  entries: LoopEntry[];
  updatedAt: string;
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildThaliSentence(input: {
  foods: LoopPlateItem[];
  loadLabel: string;
  recovery: number | null;
  strain: number | null;
}): string {
  const parts = input.foods
    .map((f) => `${f.grams}g ${f.foodName}`)
    .join(", ");
  const recovery =
    input.recovery != null ? `recovery ${input.recovery}` : "recovery n/a";
  const strain =
    input.strain != null
      ? `strain ${Number(input.strain).toFixed(1)}`
      : "strain n/a";
  return `Tonight’s plate: ${parts}. For ${input.loadLabel.toLowerCase()} (${recovery}, ${strain}). Whole food — soak / sprout / tadka as your kitchen knows.`;
}
