export type GameCategoryId = 'ten-seconds' | 'one-minute' | 'full-match' | 'random';

export type PlayableGameCategoryId = Exclude<GameCategoryId, 'random'>;

export interface GameCategory {
  id: GameCategoryId;
  title: string;
  description: string;
}

export interface MockGame {
  id: string;
  category: PlayableGameCategoryId;
  name: string;
  description: string;
  durationLabel: string;
}

export type GameRewardTicketType = 'normal' | 'premium';

export interface GameResult {
  playId: string;
  gameId: string;
  gameName: string;
  score: number;
  success: boolean;
  playTimeSeconds: number;
  playedAt: string;
  rewardedTicketType: GameRewardTicketType | null;
  rewardedQuantity: number;
  normalBalance: number;
  premiumBalance: number;
}

export interface FinishGameResult {
  playId: string;
  rewardedTicketType: GameRewardTicketType | null;
  rewardedQuantity: number;
  normalBalance: number;
  premiumBalance: number;
}
