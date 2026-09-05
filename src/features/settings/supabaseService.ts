import { getSupabaseClient } from '../../lib/supabase';
import type { NotificationPreferenceKey, NotificationPreferences } from './types';

interface PreferenceRow {
  wish_received: boolean;
  wish_morning: boolean;
  wish_confirmation: boolean;
  game_reward: boolean;
}

const columns: Record<NotificationPreferenceKey, keyof PreferenceRow> = {
  wishReceived: 'wish_received',
  wishMorning: 'wish_morning',
  wishConfirmation: 'wish_confirmation',
  gameReward: 'game_reward',
};

export const settingsSupabaseService = {
  async fetchNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await getSupabaseClient()
      .from('notification_preferences')
      .select('wish_received,wish_morning,wish_confirmation,game_reward')
      .eq('user_id', userId)
      .single<PreferenceRow>();
    if (error) throw error;
    return mapPreferences(data);
  },

  async updateNotificationPreference(userId: string, key: NotificationPreferenceKey, value: boolean) {
    const { error } = await getSupabaseClient()
      .from('notification_preferences')
      .update({ [columns[key]]: value })
      .eq('user_id', userId);
    if (error) throw error;
  },
};

function mapPreferences(row: PreferenceRow): NotificationPreferences {
  return {
    wishReceived: row.wish_received,
    wishMorning: row.wish_morning,
    wishConfirmation: row.wish_confirmation,
    gameReward: row.game_reward,
  };
}
