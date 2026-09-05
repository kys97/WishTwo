import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, PremiumBadge, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../auth';
import { gameSupabaseService } from './supabaseService';
import type { GameResult } from './types';

export function GameResultScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ playId?: string | string[] }>();
  const playId = Array.isArray(params.playId) ? params.playId[0] : params.playId;
  const [result, setResult] = useState<GameResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(useCallback(() => {
    if (!playId || !user) return undefined;
    let active = true;
    void gameSupabaseService.fetchResult(playId, user.id)
      .then((value) => { if (active) setResult(value); })
      .catch((error) => { if (active) setErrorMessage(error instanceof Error ? error.message : '게임 결과를 불러오지 못했습니다.'); });
    return () => { active = false; };
  }, [playId, user]));

  const rewardLabel = result?.rewardedTicketType === 'premium'
    ? `Premium 소원권 ${result.rewardedQuantity}장`
    : result?.rewardedTicketType === 'normal'
      ? `일반 소원권 ${result.rewardedQuantity}장`
      : '획득한 소원권 없음';

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}>
      <View style={styles.heading}>
        <Ionicons accessibilityElementsHidden color={colors.primary} importantForAccessibility="no-hide-descendants" name="trophy-outline" size={42} />
        <Text accessibilityRole="header" style={styles.title}>게임 결과</Text>
      </View>
      {result ? (
        <>
          <AppCard accessible accessibilityLabel={`${result.gameName}, ${result.score}점, ${result.success ? '성공' : '실패'}, 플레이 시간 ${result.playTimeSeconds}초`} elevated style={styles.card}>
            <Text style={styles.gameName}>{result.gameName}</Text>
            <Text style={styles.score}>{result.score}점</Text>
            <Text style={styles.meta}>{result.success ? '성공' : '실패'} · {result.playTimeSeconds}초</Text>
          </AppCard>
          <AppCard accessible accessibilityLabel={`획득 보상, ${rewardLabel}`} style={styles.card}>
            <View style={styles.rewardHeading}><Text accessibilityRole="header" style={styles.sectionTitle}>획득한 소원권</Text>{result.rewardedTicketType === 'premium' ? <PremiumBadge /> : null}</View>
            <Text style={styles.reward}>{rewardLabel}</Text>
          </AppCard>
          <AppCard accessible accessibilityLabel={`현재 보유 소원권, 일반 ${result.normalBalance}장, Premium ${result.premiumBalance}장`} style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>현재 보유 소원권</Text>
            <Text style={styles.balance}>일반 소원권 {result.normalBalance}장</Text>
            <Text style={styles.balance}>Premium 소원권 {result.premiumBalance}장</Text>
          </AppCard>
          <AppButton accessibilityLabel="게임 목록으로 돌아가기" onPress={() => router.replace('/games')}>게임 목록으로</AppButton>
        </>
      ) : (
        <Text accessibilityLiveRegion="polite" style={styles.message}>{errorMessage || '게임 결과를 불러오고 있어요.'}</Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  heading: { alignItems: 'center', gap: spacing.sm },
  title: { ...typography.display, color: colors.textPrimary },
  card: { gap: spacing.sm },
  gameName: { ...typography.title2, color: colors.textPrimary, textAlign: 'center' },
  score: { ...typography.display, color: colors.primary, textAlign: 'center' },
  meta: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  rewardHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.title3, color: colors.textPrimary },
  reward: { ...typography.title2, color: colors.primary },
  balance: { ...typography.bodyMedium, color: colors.textSecondary },
  message: { ...typography.body, color: colors.textSecondary },
});
