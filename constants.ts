
import { Rank } from './types';

export const RANK_THRESHOLDS = [
  { minRedeems: 0, rank: Rank.BRONZE, color: 'text-orange-700', bg: 'bg-orange-100' },
  { minRedeems: 3, rank: Rank.SILVER, color: 'text-slate-500', bg: 'bg-slate-100' },
  { minRedeems: 6, rank: Rank.GOLD, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { minRedeems: 11, rank: Rank.PLATINUM, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { minRedeems: 21, rank: Rank.DIAMOND, color: 'text-blue-600', bg: 'bg-blue-100' },
  { minRedeems: 51, rank: Rank.TITAN, color: 'text-purple-700', bg: 'bg-purple-100' },
];

export const getRankInfo = (redeems: number) => {
  return [...RANK_THRESHOLDS].reverse().find(t => redeems >= t.minRedeems) || RANK_THRESHOLDS[0];
};

export const generateCustomerId = (count: number): string => {
  const padded = (count + 1).toString().padStart(4, '0');
  return `MSC${padded}`;
};
