import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton, ScreenContainer } from '../../components';
import { useAuth } from '../../features/auth';
import type { AuthUser } from '../../features/auth';
import { colors, spacing, typography } from '../../theme';

function getNextRoute(user: AuthUser): Href {
  if (!user.profileCompleted) return '/social-profile' as Href;
  if (!user.isCoupleConnected) return '/couple-connect';
  return '/home';
}

export default function OAuthCallbackRoute() {
  const router = useRouter();
  const linkingUrl = Linking.useURL();
  const { completeOAuthCallback, oauthCallbackUrl } = useAuth();
  const handledUrl = useRef<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setErrorMessage('로그인 응답을 확인하지 못했습니다. 다시 시도해주세요.');
    }, 15000);

    const finishLogin = async () => {
      const initialUrl = await Linking.getInitialURL();
      const url = [oauthCallbackUrl, linkingUrl, initialUrl]
        .find((value) => value?.startsWith('wishu://auth/callback'));
      if (!url || handledUrl.current === url) return;
      handledUrl.current = url;

      try {
        const user = await Promise.race([
          completeOAuthCallback(url),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('로그인 처리 시간이 초과되었습니다. 다시 시도해주세요.')), 15000);
          }),
        ]);
        clearTimeout(timeout);
        if (active) router.replace(getNextRoute(user));
      } catch (error) {
        clearTimeout(timeout);
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : '소셜 로그인을 완료하지 못했습니다.');
        }
      }
    };

    void finishLogin();
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [completeOAuthCallback, linkingUrl, oauthCallbackUrl, router]);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} contentContainerStyle={styles.container}>
      <View accessibilityLiveRegion="polite" style={styles.content}>
        {errorMessage ? (
          <>
            <Text accessibilityRole="header" style={styles.title}>로그인을 완료하지 못했어요</Text>
            <Text style={styles.message}>{errorMessage}</Text>
            <AppButton accessibilityLabel="로그인 화면으로 돌아가기" onPress={() => router.replace('/login')}>
              로그인으로 돌아가기
            </AppButton>
          </>
        ) : (
          <>
            <ActivityIndicator accessibilityLabel="로그인 처리 중" color={colors.primary} size="large" />
            <Text accessibilityRole="header" style={styles.title}>로그인 중이에요</Text>
            <Text style={styles.message}>계정 정보를 확인하고 있습니다.</Text>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { gap: spacing.md, alignItems: 'center' },
  title: { ...typography.title2, color: colors.textPrimary, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
