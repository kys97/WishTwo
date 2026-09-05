import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton, AppCard, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../auth';
import { getNotificationPermissionStateAsync, registerPushTokenAsync, requestNotificationPermissionAsync } from '../notifications/notificationService';
import { settingsSupabaseService } from './supabaseService';
import type { NotificationPermissionState, NotificationPreferenceKey, NotificationPreferences } from './types';

const preferenceItems: readonly { key: NotificationPreferenceKey; label: string; description: string }[] = [
  { key: 'wishReceived', label: '소원 도착 알림', description: '상대방이 보낸 소원을 알려드려요.' },
  { key: 'wishMorning', label: '소원 실행일 아침 알림', description: '소원을 들어주는 날 아침에 알려드려요.' },
  { key: 'wishConfirmation', label: '밤 10시 완료 확인 알림', description: '소원을 들어줬는지 확인할 때 알려드려요.' },
  { key: 'gameReward', label: '게임/보상 관련 알림', description: '게임에서 소원권을 획득하면 알려드려요.' },
] as const;

export function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permission, setPermission] = useState<NotificationPermissionState>('undetermined');
  const [savingKey, setSavingKey] = useState<NotificationPreferenceKey | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(useCallback(() => {
    if (!user) return undefined;
    let active = true;
    void Promise.all([
      settingsSupabaseService.fetchNotificationPreferences(user.id),
      getNotificationPermissionStateAsync(),
    ]).then(([nextPreferences, nextPermission]) => {
      if (active) { setPreferences(nextPreferences); setPermission(nextPermission); setErrorMessage(''); }
    }).catch((error) => {
      if (active) setErrorMessage(error instanceof Error ? error.message : '알림 설정을 불러오지 못했습니다.');
    });
    return () => { active = false; };
  }, [user]));

  const toggle = async (key: NotificationPreferenceKey, value: boolean) => {
    if (!user || !preferences) return;
    const previous = preferences;
    setPreferences({ ...preferences, [key]: value });
    setSavingKey(key);
    setErrorMessage('');
    try {
      await settingsSupabaseService.updateNotificationPreference(user.id, key, value);
      if (value && permission !== 'granted' && permission !== 'unavailable') {
        const nextPermission = await requestNotificationPermissionAsync();
        setPermission(nextPermission);
        if (nextPermission === 'granted') await registerPushTokenAsync();
      }
    } catch (error) {
      setPreferences(previous);
      setErrorMessage(error instanceof Error ? error.message : '알림 설정을 저장하지 못했습니다.');
    } finally {
      setSavingKey(null);
    }
  };

  const permissionBlocked = permission === 'denied';

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="마이 화면으로 돌아가기" accessibilityRole="button" hitSlop={spacing.sm} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons accessibilityElementsHidden color={colors.textPrimary} importantForAccessibility="no-hide-descendants" name="arrow-back" size={24} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>알림 설정</Text>
      </View>

      {permissionBlocked ? (
        <AppCard accessible accessibilityLabel="기기의 알림 권한이 꺼져 있습니다. 시스템 설정에서 허용할 수 있습니다." style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>기기 알림 권한이 꺼져 있어요.</Text>
          <Text style={styles.description}>앱 설정에서 알림 권한을 허용해야 알림을 받을 수 있습니다.</Text>
          <AppButton accessibilityLabel="기기 시스템 설정 열기" onPress={() => void Linking.openSettings()} variant="secondary">시스템 설정 열기</AppButton>
        </AppCard>
      ) : null}

      <AppCard style={styles.settingsCard}>
        {preferenceItems.map((item) => (
          <View key={item.key} style={styles.settingRow}>
            <View style={styles.copy}><Text style={styles.settingLabel}>{item.label}</Text><Text style={styles.description}>{item.description}</Text></View>
            <Switch accessibilityHint={item.description} accessibilityLabel={item.label} accessibilityRole="switch" accessibilityState={{ checked: preferences?.[item.key] ?? false, disabled: !preferences || savingKey === item.key }} disabled={!preferences || savingKey === item.key} onValueChange={(value) => void toggle(item.key, value)} thumbColor={colors.surface} trackColor={{ false: colors.disabled, true: colors.primary }} value={preferences?.[item.key] ?? false} />
          </View>
        ))}
      </AppCard>
      {Platform.OS === 'web' ? <Text style={styles.note}>웹에서는 Expo 푸시 알림 권한과 토큰 등록을 지원하지 않습니다.</Text> : null}
      {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  header: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backButton: { width: 32, height: 39, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  title: { ...typography.title1, color: colors.textPrimary },
  permissionCard: { gap: spacing.sm },
  permissionTitle: { ...typography.headline, color: colors.textPrimary },
  settingsCard: { gap: spacing.lg },
  settingRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xxs },
  settingLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  description: { ...typography.caption, color: colors.textSecondary },
  note: { ...typography.caption, color: colors.textMuted },
  error: { ...typography.caption, color: colors.danger },
});
