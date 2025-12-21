
import { Rank } from './types';

// Points to your logo.png in the root directory. 
// Added a timestamp to help with browser caching when you update the file.
export const COMPANY_LOGO_URL = `./logo.png?v=${new Date().getTime()}`;

export const RANK_THRESHOLDS = [
  { minRedeems: 0, rank: Rank.BRONZE, color: 'text-orange-600', bg: 'bg-orange-50' },
  { minRedeems: 3, rank: Rank.SILVER, color: 'text-slate-500', bg: 'bg-slate-50' },
  { minRedeems: 6, rank: Rank.GOLD, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { minRedeems: 11, rank: Rank.PLATINUM, color: 'text-blue-600', bg: 'bg-blue-50' },
  { minRedeems: 21, rank: Rank.DIAMOND, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { minRedeems: 51, rank: Rank.TITAN, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export const getRankInfo = (redeems: number) => {
  return [...RANK_THRESHOLDS].reverse().find(t => redeems >= t.minRedeems) || RANK_THRESHOLDS[0];
};

export const generateCustomerId = (count: number): string => {
  const padded = (count + 1).toString().padStart(4, '0');
  return `MSC${padded}`;
};
