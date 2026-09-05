export interface NotificationPreferences {
  wishReceived: boolean;
  wishMorning: boolean;
  wishConfirmation: boolean;
  gameReward: boolean;
}

export type NotificationPreferenceKey = keyof NotificationPreferences;
export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';
