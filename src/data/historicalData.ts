import rawData from './kalyanHistorical.json';
import rajdhaniRawData from './rajdhaniNightHistorical.json';
import manipurRawData from './manipurHistorical.json';
import { WeekRecord, MarketType } from '../types';

export const kalyanHistory: WeekRecord[] = rawData as WeekRecord[];
export const rajdhaniNightHistory: WeekRecord[] = rajdhaniRawData as WeekRecord[];
export const manipurHistory: WeekRecord[] = manipurRawData as WeekRecord[];

export const latestWeek = kalyanHistory[kalyanHistory.length - 1];

export function getInitialHistory(market: MarketType = 'kalyan'): WeekRecord[] {
  if (market === 'rajdhani_night') return rajdhaniNightHistory;
  if (market === 'manipur') return manipurHistory;
  return kalyanHistory;
}
