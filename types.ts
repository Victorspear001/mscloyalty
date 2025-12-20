
export enum Rank {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
  DIAMOND = 'Diamond',
  TITAN = 'Titan'
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  customer_id: string; // Format "MSCxxxx"
  stamps: number; // 0-6
  redeems: number;
  lifetime_stamps: number;
  tier_1_claimed: boolean; // Tracking for 3-stamp reward
  is_deleted: boolean;
  created_at: string;
}

export interface Admin {
  username: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}

export type AppView = 
  | 'LOGIN' 
  | 'CUSTOMER_DASHBOARD' 
  | 'ADMIN_LOGIN' 
  | 'ADMIN_REGISTER' 
  | 'ADMIN_RESET' 
  | 'ADMIN_DASHBOARD' 
  | 'ADMIN_HISTORY';
