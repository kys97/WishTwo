import { getSupabaseClient } from '../../lib/supabase';
import type { FinishGameResult, GameResult, GameRewardTicketType } from './types';

interface FinishGameRow {
  play_id: string;
  rewarded_ticket_type: GameRewardTicketType | null;
  rewarded_quantity: number;
  normal_balance: number;
  premium_balance: number;
}

interface GamePlayRow {
  id: string;
  game_id: string;
  score: number;
  success: boolean;
  play_time_seconds: number;
  played_at: string;
  game: { name: string } | { name: string }[];
  reward: { ticket_type: GameRewardTicketType; quantity: number } | { ticket_type: GameRewardTicketType; quantity: number }[] | null;
}

export const gameSupabaseService = {
  async startGame(gameId: string) {
    const { data, error } = await getSupabaseClient().rpc('start_game', { input_game_id: gameId });
    if (error) throw error;
    return data as string;
  },

  async finishGame(playId: string, score: number, success: boolean): Promise<FinishGameResult> {
    const { data, error } = await getSupabaseClient().rpc('finish_game', {
      input_play_id: playId,
      input_score: score,
      input_success: success,
    });
    if (error) throw error;
    const row = ((data ?? []) as FinishGameRow[])[0];
    if (!row) throw new Error('게임 결과를 저장하지 못했습니다.');
    return {
      playId: row.play_id,
      rewardedTicketType: row.rewarded_ticket_type,
      rewardedQuantity: row.rewarded_quantity,
      normalBalance: row.normal_balance,
      premiumBalance: row.premium_balance,
    };
  },

  async fetchResult(playId: string, userId: string): Promise<GameResult> {
    const supabase = getSupabaseClient();
    const [{ data, error }, { data: balances, error: balanceError }] = await Promise.all([
      supabase
        .from('game_plays')
        .select('id,game_id,score,success,play_time_seconds,played_at,game:game_definitions!game_plays_game_id_fkey(name),reward:game_rewards(ticket_type,quantity)')
        .eq('id', playId)
        .eq('status', 'completed')
        .single(),
      supabase.from('wish_ticket_balances').select('ticket_type,quantity').eq('user_id', userId),
    ]);
    if (error) throw error;
    if (balanceError) throw balanceError;
    const row = data as unknown as GamePlayRow;
    const game = Array.isArray(row.game) ? row.game[0] : row.game;
    const reward = Array.isArray(row.reward) ? row.reward[0] : row.reward;
    const getBalance = (type: GameRewardTicketType) =>
      ((balances ?? []) as { ticket_type: GameRewardTicketType; quantity: number }[])
        .find((item) => item.ticket_type === type)?.quantity ?? 0;
    return {
      playId: row.id,
      gameId: row.game_id,
      gameName: game.name,
      score: row.score,
      success: row.success,
      playTimeSeconds: row.play_time_seconds,
      playedAt: row.played_at,
      rewardedTicketType: reward?.ticket_type ?? null,
      rewardedQuantity: reward?.quantity ?? 0,
      normalBalance: getBalance('normal'),
      premiumBalance: getBalance('premium'),
    };
  },
};
