import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '../auth';
import { registerPushTokenAsync } from './notificationService';

export function PushNotificationProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuth();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !isHydrated || !isAuthenticated || !user) return;
    const timeout = setTimeout(() => void registerPushTokenAsync().catch(() => undefined), 0);
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      void registerPushTokenAsync().catch(() => undefined);
    });
    return () => {
      clearTimeout(timeout);
      tokenSubscription.remove();
    };
  }, [isAuthenticated, isHydrated, user]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const openResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response || !isAuthenticated || !user?.isCoupleConnected) return;
      const responseId = response.notification.request.identifier;
      if (handledResponseId.current === responseId) return;
      const data = response.notification.request.content.data ?? {};
      const wishId = typeof data.wishId === 'string' ? data.wishId : null;
      const playId = typeof data.playId === 'string' ? data.playId : null;
      const type = typeof data.notificationType === 'string' ? data.notificationType : null;
      handledResponseId.current = responseId;
      if (type === 'game_reward' && playId) {
        router.push(`/game-result/${playId}` as Href);
      } else if (!wishId) {
        return;
      } else if (type === 'wish_confirmation') {
        router.push({ pathname: '/wish-completion/[id]', params: { id: wishId } });
      } else if (type === 'wish_received' || type === 'wish_morning') {
        router.push({ pathname: '/wish-detail/[id]', params: { id: wishId } });
      }
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(openResponse);
    void Notifications.getLastNotificationResponseAsync().then(openResponse);
    return () => responseSubscription.remove();
  }, [isAuthenticated, router, user]);

  return children;
}
