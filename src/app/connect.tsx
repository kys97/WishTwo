import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton, ScreenContainer } from '../components';
import { useAuth } from '../features/auth';
import { isValidCoupleCode, normalizeCoupleCode } from '../features/auth/pendingCoupleCode';
import { colors, spacing, typography } from '../theme';

export default function ConnectLinkRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const code = rawCode ? normalizeCoupleCode(rawCode) : '';
  const validCode = isValidCoupleCode(code);
  const { isAuthenticated, isHydrated, savePendingCoupleCode } = useAuth();
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    if (!isHydrated || !validCode) return;
    let active = true;
    const continueToApp = async () => {
      try {
        await savePendingCoupleCode(code);
        if (!active) return;
        router.replace(isAuthenticated ? { pathname: '/couple-connect', params: { code } } : '/login');
      } catch (error) {
        if (active) setStorageError(error instanceof Error ? error.message : '연결 코드를 저장하지 못했습니다.');
      }
    };
    void continueToApp();
    return () => { active = false; };
  }, [code, isAuthenticated, isHydrated, router, savePendingCoupleCode, validCode]);

  const errorMessage = storageError || (!validCode ? '올바르지 않은 연결 링크입니다. WISH-XXXXXXXX 형식의 코드를 확인해주세요.' : '');

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} contentContainerStyle={styles.container}>
      <View accessibilityLiveRegion="polite" style={styles.content}>
        {errorMessage ? (
          <>
            <Text accessibilityRole="header" style={styles.title}>연결 링크를 확인해주세요</Text>
            <Text style={styles.message}>{errorMessage}</Text>
            <AppButton accessibilityLabel="로그인 화면으로 이동" onPress={() => router.replace('/login')}>로그인으로 이동</AppButton>
          </>
        ) : (
          <>
            <ActivityIndicator accessibilityLabel="연결 코드 확인 중" color={colors.primary} size="large" />
            <Text accessibilityRole="header" style={styles.title}>연결 코드를 확인하고 있어요</Text>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { alignItems: 'center', gap: spacing.md },
  title: { ...typography.title2, color: colors.textPrimary, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
