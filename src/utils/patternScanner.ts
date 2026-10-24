import { DayKey, WeekRecord } from '../types';
import {
  ALL_PANAS,
  calculatePanaSum,
  DAY_KEYS,
  getFamilyJodis,
  isMarketClosed,
  isRedJodi,
  isValidPlayedJodi,
} from './matkaMath';

export type PatternMatchMode = 'exact' | 'palat' | 'family';

export interface PatternOccurrence {
  weekIndex: number;
  week: string;
  day: DayKey;
  matchedJodi: string;
  openPana: string;
  closePana: string;
  nextDraw: {
    week: string;
    day: DayKey;
    jodi: string;
    openPana: string;
    closePana: string;
  } | null;
  sameDayNextWeek: {
    week: string;
    day: DayKey;
    jodi: string;
    openPana: string;
    closePana: string;
  } | null;
}

export interface RankedDigitStat {
  digit: number;
  count: number;
  percentage: number;
}

export interface RankedJodiStat {
  jodi: string;
  count: number;
  percentage: number;
  isRed: boolean;
}

export interface PatternScanResult {
  queryJodi: string;
  mode: PatternMatchMode;
  targetSet: string[];
  totalOccurrences: number;
  weeksSinceLastSeen: number;
  averageWeekGap: number;
  nextDrawSampleSize: number;
  nextDrawTopOTC: RankedDigitStat[];
  nextDrawTopJodis: RankedJodiStat[];
  nextDrawRedRate: number;
  sameDaySampleSize: number;
  sameDayTopOTC: RankedDigitStat[];
  sameDayTopJodis: RankedJodiStat[];
  sameDayRedRate: number;
  recentOccurrences: PatternOccurrence[];
}

export function scanJodiPatterns(
  history: WeekRecord[],
  rawJodi: string,
  mode: PatternMatchMode = 'exact'
): PatternScanResult {
  const cleanJodi = rawJodi.replace(/\D/g, '').slice(0, 2).padStart(2, '0');
  let targetSet: string[] = [cleanJodi];

  if (mode === 'palat') {
    const rev = `${cleanJodi[1]}${cleanJodi[0]}`;
    targetSet = Array.from(new Set([cleanJodi, rev]));
  } else if (mode === 'family') {
    targetSet = getFamilyJodis(cleanJodi);
  }

  const targetLookup = new Set(targetSet);

  // Flatten chronological valid trading draws so "Next Draw" finds the exact next active market day
  const flatDraws: {
    weekIndex: number;
    week: string;
    day: DayKey;
    openPana: string;
    jodi: string;
    closePana: string;
  }[] = [];

  history.forEach((rec, wIdx) => {
    for (const day of DAY_KEYS) {
      const cell = rec[day];
      if (cell && isValidPlayedJodi(cell.jodi)) {
        flatDraws.push({
          weekIndex: wIdx,
          week: rec.week,
          day,
          openPana: cell.openPana,
          jodi: cell.jodi,
          closePana: cell.closePana,
        });
      }
    }
  });

  const occurrences: PatternOccurrence[] = [];
  const nextDrawDigitHits: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  const nextDrawJodiCounts: Record<string, number> = {};
  let nextDrawCount = 0;
  let nextDrawRedCount = 0;

  const sameDayDigitHits: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  const sameDayJodiCounts: Record<string, number> = {};
  let sameDayCount = 0;
  let sameDayRedCount = 0;

  for (let i = 0; i < flatDraws.length; i++) {
    const cur = flatDraws[i];
    if (!targetLookup.has(cur.jodi)) continue;

    const nextItem = i + 1 < flatDraws.length ? flatDraws[i + 1] : null;
    if (nextItem) {
      nextDrawCount++;
      const o = parseInt(nextItem.jodi[0], 10);
      const c = parseInt(nextItem.jodi[1], 10);
      if (!isNaN(o)) nextDrawDigitHits[o]++;
      if (!isNaN(c) && c !== o) nextDrawDigitHits[c]++;
      else if (!isNaN(c) && c === o) {
        // Count distinct draw hit once so percentage represents "% of draws containing digit"
      }
      nextDrawJodiCounts[nextItem.jodi] = (nextDrawJodiCounts[nextItem.jodi] || 0) + 1;
      if (isRedJodi(nextItem.jodi)) nextDrawRedCount++;
    }

    // Same weekday in next week (or next non-holiday week if next week was closed)
    let sameDayNext: PatternOccurrence['sameDayNextWeek'] = null;
    const nextWeekRec = history[cur.weekIndex + 1];
    if (nextWeekRec) {
      const nextWeekCell = nextWeekRec[cur.day];
      if (nextWeekCell && isValidPlayedJodi(nextWeekCell.jodi) && !isMarketClosed(nextWeekCell.jodi)) {
        sameDayNext = {
          week: nextWeekRec.week,
          day: cur.day,
          jodi: nextWeekCell.jodi,
          openPana: nextWeekCell.openPana,
          closePana: nextWeekCell.closePana,
        };
        sameDayCount++;
        const o = parseInt(nextWeekCell.jodi[0], 10);
        const c = parseInt(nextWeekCell.jodi[1], 10);
        if (!isNaN(o)) sameDayDigitHits[o]++;
        if (!isNaN(c) && c !== o) sameDayDigitHits[c]++;
        sameDayJodiCounts[nextWeekCell.jodi] = (sameDayJodiCounts[nextWeekCell.jodi] || 0) + 1;
        if (isRedJodi(nextWeekCell.jodi)) sameDayRedCount++;
      }
    }

    occurrences.push({
      weekIndex: cur.weekIndex,
      week: cur.week,
      day: cur.day,
      matchedJodi: cur.jodi,
      openPana: cur.openPana,
      closePana: cur.closePana,
      nextDraw: nextItem
        ? {
            week: nextItem.week,
            day: nextItem.day,
            jodi: nextItem.jodi,
            openPana: nextItem.openPana,
            closePana: nextItem.closePana,
          }
        : null,
      sameDayNextWeek: sameDayNext,
    });
  }

  const rankDigits = (counts: Record<number, number>, denom: number): RankedDigitStat[] =>
    Object.keys(counts)
      .map((k) => {
        const d = parseInt(k, 10);
        const cnt = counts[d] || 0;
        return {
          digit: d,
          count: cnt,
          percentage: denom > 0 ? Math.round((cnt / denom) * 100) : 0,
        };
      })
      .sort((a, b) => b.count - a.count || a.digit - b.digit)
      .slice(0, 4);

  const rankJodis = (counts: Record<string, number>, denom: number): RankedJodiStat[] =>
    Object.entries(counts)
      .map(([jodi, cnt]) => ({
        jodi,
        count: cnt,
        percentage: denom > 0 ? Number(((cnt / denom) * 100).toFixed(1)) : 0,
        isRed: isRedJodi(jodi),
      }))
      .sort((a, b) => b.count - a.count || a.jodi.localeCompare(b.jodi))
      .slice(0, 6);

  const lastOcc = occurrences[occurrences.length - 1];
  const weeksSinceLastSeen = lastOcc ? Math.max(0, history.length - 1 - lastOcc.weekIndex) : -1;

  let avgGap = 0;
  if (occurrences.length >= 2) {
    let gapSum = 0;
    for (let i = 1; i < occurrences.length; i++) {
      gapSum += Math.max(0, occurrences[i].weekIndex - occurrences[i - 1].weekIndex);
    }
    avgGap = Number((gapSum / (occurrences.length - 1)).toFixed(1));
  }

  return {
    queryJodi: cleanJodi,
    mode,
    targetSet,
    totalOccurrences: occurrences.length,
    weeksSinceLastSeen,
    averageWeekGap: avgGap,
    nextDrawSampleSize: nextDrawCount,
    nextDrawTopOTC: rankDigits(nextDrawDigitHits, nextDrawCount),
    nextDrawTopJodis: rankJodis(nextDrawJodiCounts, nextDrawCount),
    nextDrawRedRate: nextDrawCount > 0 ? Math.round((nextDrawRedCount / nextDrawCount) * 100) : 0,
    sameDaySampleSize: sameDayCount,
    sameDayTopOTC: rankDigits(sameDayDigitHits, sameDayCount),
    sameDayTopJodis: rankJodis(sameDayJodiCounts, sameDayCount),
    sameDayRedRate: sameDayCount > 0 ? Math.round((sameDayRedCount / sameDayCount) * 100) : 0,
    recentOccurrences: [...occurrences].reverse().slice(0, 15),
  };
}

export interface SangamSetResult {
  halfSangamOpenPanaCloseAnk: { label: string; openPana: string; closeAnk: number; jodi: string }[];
  halfSangamOpenAnkClosePana: { label: string; openAnk: number; closePana: string; jodi: string }[];
  fullSangams: { label: string; openPana: string; closePana: string; jodi: string; isRed: boolean }[];
}

export function generateSangamSets(
  openPanas: string[],
  closePanas: string[],
  openDigits: number[],
  closeDigits: number[]
): SangamSetResult {
  const validOpenPanas = Array.from(
    new Set(openPanas.map((p) => p.trim()).filter((p) => /^\d{3}$/.test(p)))
  ).slice(0, 6);
  const validClosePanas = Array.from(
    new Set(closePanas.map((p) => p.trim()).filter((p) => /^\d{3}$/.test(p)))
  ).slice(0, 6);
  const validOpenDigits = Array.from(new Set(openDigits.filter((d) => d >= 0 && d <= 9))).slice(0, 4);
  const validCloseDigits = Array.from(new Set(closeDigits.filter((d) => d >= 0 && d <= 9))).slice(0, 4);

  const halfA: SangamSetResult['halfSangamOpenPanaCloseAnk'] = [];
  for (const op of validOpenPanas) {
    const oAnk = calculatePanaSum(op);
    for (const cAnk of validCloseDigits) {
      halfA.push({
        label: `${op} - ${cAnk}`,
        openPana: op,
        closeAnk: cAnk,
        jodi: `${oAnk}${cAnk}`,
      });
    }
  }

  const halfB: SangamSetResult['halfSangamOpenAnkClosePana'] = [];
  for (const oAnk of validOpenDigits) {
    for (const cp of validClosePanas) {
      const cAnk = calculatePanaSum(cp);
      halfB.push({
        label: `${oAnk} - ${cp}`,
        openAnk: oAnk,
        closePana: cp,
        jodi: `${oAnk}${cAnk}`,
      });
    }
  }

  const full: SangamSetResult['fullSangams'] = [];
  for (const op of validOpenPanas) {
    const oAnk = calculatePanaSum(op);
    for (const cp of validClosePanas) {
      const cAnk = calculatePanaSum(cp);
      const jodi = `${oAnk}${cAnk}`;
      full.push({
        label: `${op} - ${jodi} - ${cp}`,
        openPana: op,
        closePana: cp,
        jodi,
        isRed: isRedJodi(jodi),
      });
    }
  }

  return {
    halfSangamOpenPanaCloseAnk: halfA,
    halfSangamOpenAnkClosePana: halfB,
    fullSangams: full,
  };
}

export function getSuggestedPanasForDigits(digits: number[]): string[] {
  const result: string[] = [];
  for (const d of digits.slice(0, 4)) {
    const sp = ALL_PANAS.singlePanas[d]?.[0];
    if (sp && !result.includes(sp)) result.push(sp);
  }
  return result.slice(0, 4);
}
