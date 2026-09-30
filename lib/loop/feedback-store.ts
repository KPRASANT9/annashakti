export type KitchenFeedback = {
  id: string;
  createdAt: string;
  shareDate: string;
  patternId: string;
  kitchenName: string;
  city: string;
  /** What confused them */
  confusedAbout: Array<
    "language" | "portions" | "steps" | "ingredients" | "timing" | "other"
  >;
  whatWasUnclear: string;
  whatWorked: string;
  wouldCookAgain: "yes" | "maybe" | "no";
};

const KEY = "annashakti_slice_c_feedback_v1";

export function loadFeedback(): KitchenFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KitchenFeedback[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFeedback(entry: KitchenFeedback): KitchenFeedback[] {
  const all = loadFeedback();
  all.unshift(entry);
  window.localStorage.setItem(KEY, JSON.stringify(all.slice(0, 100)));
  return all;
}
