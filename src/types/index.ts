export type MarketType = 'kalyan' | 'rajdhani_night' | 'manipur';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface MarketInfo {
  id: MarketType;
  name: { mr: string; en: string };
  tagline: { mr: string; en: string };
  openTime: string;
  closeTime: string;
  daysActive: DayKey[];
  totalWeeksLabel: string;
}

export const MARKETS: Record<MarketType, MarketInfo> = {
  kalyan: {
    id: 'kalyan',
    name: { mr: 'कल्याण (Kalyan)', en: 'Kalyan' },
    tagline: { mr: 'दुपारचे प्रमुख अधिकृत मार्केट (सोम-शनि)', en: 'Primary Day Market (Mon-Sat)' },
    openTime: 'संध्याकाळी ०४:५०',
    closeTime: 'संध्याकाळी ०६:५०',
    daysActive: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    totalWeeksLabel: '273 आठवडे (2021-2026)',
  },
  rajdhani_night: {
    id: 'rajdhani_night',
    name: { mr: 'राजधानी नाईट (Rajdhani Night)', en: 'Rajdhani Night' },
    tagline: { mr: 'रात्रीचे लोकप्रिय मार्केट (सोम-शुक्र)', en: 'Premier Night Market (Mon-Fri)' },
    openTime: 'रात्री ०९:३५',
    closeTime: 'रात्री ११:४५',
    daysActive: ['mon', 'tue', 'wed', 'thu', 'fri'],
    totalWeeksLabel: '535 आठवडे (2016-2026)',
  },
  manipur: {
    id: 'manipur',
    name: { mr: 'मणीपुर (Manipur)', en: 'Manipur' },
    tagline: { mr: 'दुपारचे लोकप्रिय मार्केट (सोम-शनि)', en: 'Popular Day Market (Mon-Sat)' },
    openTime: 'दुपारी ०३:२०',
    closeTime: 'संध्याकाळी ०५:२०',
    daysActive: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    totalWeeksLabel: '208 आठवडे (2022-2026)',
  },
};

export interface DayData {
  openPana: string;
  jodi: string;
  closePana: string;
}

export interface WeekRecord {
  week: string;
  mon: DayData;
  tue: DayData;
  wed: DayData;
  thu: DayData;
  fri: DayData;
  sat: DayData;
}

export type Language = 'mr' | 'en';

export interface FormulaStep {
  title: string;
  calculation: string;
  result: string;
  note?: string;
}

export interface JodiProbability {
  jodi: string;
  probability: number;
  consensusText: string;
  formulaCount: number;
  level: 'super' | 'strong' | 'moderate' | 'support';
}

export interface DigitConfluence {
  digit: number;
  matchCount: number;
  totalFormulas: number;
  formulaNames: string[];
}

export type CalculationFormulaId = 'master' | 'lineFamily' | 'totalDiff' | 'weeklyLine' | 'frequency';

export interface PredictionResult {
  targetDay: DayKey;
  targetWeek: string;
  formulaId: string;
  formulaName: string;
  primaryOTC: number[]; // 4 digits
  confidence: number; // percentage
  strongJodis: string[];
  supportJodis: string[];
  singlePanas: { ank: number; panas: string[] }[];
  doublePanas: { ank: number; panas: string[] }[];
  derivationSteps: FormulaStep[];
  lineAnalysis: string;
  historicalHitRate?: number;
  jodiProbabilities?: Record<string, JodiProbability>;
  digitConfluences?: DigitConfluence[];
}

export interface BacktestSummary {
  totalTested: number;
  openHits: number;
  closeHits: number;
  otcHits: number; // Either open or close hit
  jodiHits: number;
  panaHits: number;
  otcHitRate: number;
  jodiHitRate: number;
  recentResults: {
    week: string;
    day: DayKey;
    actualJodi: string;
    actualOpenPana: string;
    actualClosePana: string;
    predictedOTC: number[];
    predictedJodis: string[];
    isOtcHit: boolean;
    isJodiHit: boolean;
    hitDetails: string;
  }[];
}

export interface DigitFrequency {
  digit: number;
  openCount: number;
  closeCount: number;
  totalCount: number;
  percentage: number;
  lastSeenDaysAgo: number;
  status: 'hot' | 'cold' | 'normal';
}

export interface PassbookEntry {
  id: string;
  userId: string;
  market: MarketType;
  week: string;
  day: DayKey;
  otcDigits: number[];
  jodis: string[];
  panas: string[];
  note: string;
  createdAtMs: number;
  syncedToCloud?: boolean;
}

export interface PassbookEvaluation {
  status: 'pending' | 'open_only' | 'jodi_pass' | 'pana_pass' | 'otc_pass' | 'miss' | 'closed';
  actualOpenPana: string;
  actualJodi: string;
  actualClosePana: string;
  matchedOtcDigits: number[];
  matchedJodi: string | null;
  matchedPanas: string[];
  badgeTextMr: string;
  badgeTextEn: string;
}

