/**
 * Slice B/C checks — patterns resolve and share round-trips.
 * Run: npx tsx scripts/validate-thali.ts
 */
import {
  THALI_PATTERNS,
  buildCookableThali,
  decodeShare,
  encodeShare,
  resolvePattern,
} from "../lib/loop/patterns";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(THALI_PATTERNS.length === 5, "five cook patterns");

assert(resolvePattern({ recovery: 40, strain: 8, sleepPerformance: 80 }).id === "low_recovery", "low recovery");
assert(resolvePattern({ recovery: 70, strain: 16, sleepPerformance: 85 }).id === "high_strain", "high strain");
assert(resolvePattern({ recovery: 70, strain: 10, sleepPerformance: 60 }).id === "poor_sleep", "poor sleep wins");
assert(resolvePattern({ recovery: 80, strain: 8, sleepPerformance: 90 }).id === "balanced", "balanced");
assert(resolvePattern({ recovery: 60, strain: 12, sleepPerformance: 80 }).id === "mixed_load", "mixed");

const thali = buildCookableThali({
  date: "2026-09-30",
  recovery: 58,
  strain: 14.2,
  sleepPerformance: 78,
});
assert(thali.items.length >= 3, "items");
assert(thali.steps.length >= 3, "steps");
assert(!/HRV|posterior|ICMR/i.test(thali.headline + thali.pattern.intent), "cook language");

const token = encodeShare(thali.sharePayload);
const back = decodeShare(token);
assert(back?.patternId === thali.pattern.id, "share roundtrip");
assert(back?.items[0].amount === thali.items[0].amount, "amounts preserved");

console.log(
  JSON.stringify(
    {
      ok: true,
      patterns: THALI_PATTERNS.map((p) => p.id),
      demoResolved: thali.pattern.id,
      headline: thali.headline,
      counter: thali.items.map((i) => `${i.name}: ${i.amount}`),
      shareChars: token.length,
    },
    null,
    2,
  ),
);
