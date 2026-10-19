import rawData from './kalyanHistorical.json';
import rajdhaniRawData from './rajdhaniNightHistorical.json';
import { WeekRecord, MarketType } from '../types';

export const kalyanHistory: WeekRecord[] = rawData as WeekRecord[];
export const rajdhaniNightHistory: WeekRecord[] = rajdhaniRawData as WeekRecord[];

export const latestWeek = kalyanHistory[kalyanHistory.length - 1];

export function getInitialHistory(market: MarketType = 'kalyan'): WeekRecord[] {
  return market === 'rajdhani_night' ? rajdhaniNightHistory : kalyanHistory;
}

