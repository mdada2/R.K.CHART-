import { MarketType, WeekRecord } from '../types';

export const LOCAL_STORAGE_PREFIX = 'rkchart_user_override_';

/**
 * Loads user overrides for the given market from localStorage.
 * Returns a dictionary of week string -> WeekRecord.
 */
export function loadLocalOverrides(market: MarketType): Record<string, WeekRecord> {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${market}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn(`Failed to parse local overrides for market ${market}:`, err);
    return {};
  }
}

/**
 * Saves all user overrides for the given market to localStorage.
 */
export function saveLocalOverrides(
  market: MarketType,
  overrides: Record<string, WeekRecord>
): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${market}`, JSON.stringify(overrides));
  } catch (err) {
    console.error(`Failed to save local overrides for market ${market}:`, err);
  }
}

/**
 * Merges base records with local user overrides.
 * Any week in overrides takes precedence over the base record.
 * Any extra week in overrides not present in base is appended.
 */
export function mergeWithOverrides(
  base: WeekRecord[],
  overrides: Record<string, WeekRecord>
): WeekRecord[] {
  const overrideValues = Object.values(overrides);
  if (overrideValues.length === 0) return base;

  const merged = base.map((item) => {
    const overrideMatch = overrides[item.week];
    if (!overrideMatch) return item;

    return {
      ...item,
      ...overrideMatch,
      mon: { ...item.mon, ...(overrideMatch.mon || {}) },
      tue: { ...item.tue, ...(overrideMatch.tue || {}) },
      wed: { ...item.wed, ...(overrideMatch.wed || {}) },
      thu: { ...item.thu, ...(overrideMatch.thu || {}) },
      fri: { ...item.fri, ...(overrideMatch.fri || {}) },
      sat: { ...item.sat, ...(overrideMatch.sat || {}) },
    };
  });

  const existingSet = new Set(merged.map((w) => w.week));
  const extraWeeks = overrideValues.filter((ow) => ow.week && !existingSet.has(ow.week));

  return [...merged, ...extraWeeks];
}

/**
 * Directly saves or updates a single WeekRecord into localStorage overrides.
 */
export function saveSingleWeekOverride(market: MarketType, weekRecord: WeekRecord): void {
  try {
    const current = loadLocalOverrides(market);
    const existing = current[weekRecord.week];
    current[weekRecord.week] = existing
      ? {
          ...existing,
          ...weekRecord,
          mon: { ...existing.mon, ...(weekRecord.mon || {}) },
          tue: { ...existing.tue, ...(weekRecord.tue || {}) },
          wed: { ...existing.wed, ...(weekRecord.wed || {}) },
          thu: { ...existing.thu, ...(weekRecord.thu || {}) },
          fri: { ...existing.fri, ...(weekRecord.fri || {}) },
          sat: { ...existing.sat, ...(weekRecord.sat || {}) },
        }
      : weekRecord;
    saveLocalOverrides(market, current);
  } catch (err) {
    console.error(`Failed to save single week override for market ${market}:`, err);
  }
}
