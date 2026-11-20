import { BadgeId } from './badges';

export const CURRENT_TERMS_VERSION = '2026.1';
export const RANKED_WIN_POINTS = 10;
export const MAX_BIO_LENGTH = 140;
export const MAX_USERNAME_LENGTH = 20;
export const MIN_USERNAME_LENGTH = 3;

export interface UserPresence {
  online: boolean;
  lastSeen: number;
}

export interface UserProfile {
  uid: string;
  accountId: string; // e.g. #SNT-4829
  username: string;
  usernameLower: string;
  email: string;
  bio: string;
  avatar: string; // Compressed WebP/JPEG data URL (<= 80KB) or Google photoURL
  points: number;
  rankedWins: number;
  rankedLosses: number;
  currentWinStreak: number;
  bestWinStreak: number;
  badges: Record<string, boolean>;
  equippedBadge: BadgeId;
  termsAcceptedAt: number | null;
  termsVersion: string;
  createdAt: number;
  updatedAt: number;
  presence: UserPresence;
}

export interface LeaderboardEntry {
  uid: string;
  accountId: string;
  username: string;
  avatar: string;
  points: number;
  equippedBadge: BadgeId;
  rankedWins: number;
  updatedAt: number;
}

export interface FriendRequestItem {
  fromUid: string;
  fromUsername: string;
  fromAccountId: string;
  fromAvatar: string;
  fromPoints: number;
  fromBadge: BadgeId;
  createdAt: number;
}

export interface FriendProfileSummary {
  uid: string;
  accountId: string;
  username: string;
  avatar: string;
  points: number;
  equippedBadge: BadgeId;
  online: boolean;
  lastSeen: number;
  since: number;
}

export interface MatchmakingPlayerCard {
  uid: string;
  username: string;
  accountId: string;
  avatar: string;
  points: number;
  equippedBadge: BadgeId;
}
