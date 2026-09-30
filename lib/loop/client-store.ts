import type { LoopEntry, LoopSnapshot } from "./types";
import { todayKey } from "./types";

const STORAGE_KEY = "annashakti_slice_a_loop_v1";

export function emptySnapshot(): LoopSnapshot {
  return { entries: [], updatedAt: new Date().toISOString() };
}

export function loadLoopSnapshot(): LoopSnapshot {
  if (typeof window === "undefined") return emptySnapshot();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySnapshot();
    const parsed = JSON.parse(raw) as LoopSnapshot;
    if (!parsed || !Array.isArray(parsed.entries)) return emptySnapshot();
    return parsed;
  } catch {
    return emptySnapshot();
  }
}

export function saveLoopSnapshot(snapshot: LoopSnapshot): void {
  if (typeof window === "undefined") return;
  const next = { ...snapshot, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function upsertEntry(entry: LoopEntry): LoopSnapshot {
  const snap = loadLoopSnapshot();
  const idx = snap.entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) snap.entries[idx] = entry;
  else snap.entries.unshift(entry);
  snap.entries.sort((a, b) => (a.date < b.date ? 1 : -1));
  saveLoopSnapshot(snap);
  return snap;
}

export function getEntryByDate(date: string): LoopEntry | undefined {
  return loadLoopSnapshot().entries.find((e) => e.date === date);
}

export function getTodayEntry(): LoopEntry | undefined {
  return getEntryByDate(todayKey());
}

export function listEntries(): LoopEntry[] {
  return loadLoopSnapshot().entries;
}
