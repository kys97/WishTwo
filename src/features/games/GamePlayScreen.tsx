import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useWishData } from '../wishes';
import { mockGames } from './mockData';
import { testRewardCriteria } from './rewardConfig';
import { gameSupabaseService } from './supabaseService';

export function GamePlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[]; playId?: string | string[] }>();
  const gameId = firstParam(params.id);
  const playId = firstParam(params.playId);
  const game = mockGames.find((item) => item.id === gameId);
  const { refresh } = useWishData();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const finish = async (score: number, success: boolean) => {
    if (!playId) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await gameSupabaseService.finishGame(playId, score, success);
      await refresh();
      router.replace(`/game-result/${playId}` as Href);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '게임 결과를 저장하지 못했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="게임 화면으로 돌아가기" accessibilityRole="button" hitSlop={spacing.sm} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons accessibilityElementsHidden color={colors.textPrimary} importantForAccessibility="no-hide-descendants" name="arrow-back" size={24} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>{game?.name ?? '게임'}</Text>
      </View>

      {game && playId ? (
        <>
          <AppCard accessible accessibilityLabel={`${game.name}, ${game.description}, ${game.durationLabel}`} elevated style={styles.gameCard}>
            <Text style={styles.duration}>{game.durationLabel}</Text>
            <Text style={styles.gameName}>{game.name}</Text>
            <Text style={styles.description}>{game.description}</Text>
          </AppCard>
          <AppCard accessible accessibilityLabel={`테스트 보상 기준, 성공하고 ${testRewardCriteria.normal.minimumScore}점 이상이면 일반 소원권, ${testRewardCriteria.premium.minimumScore}점 이상이면 Premium 소원권`}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>게임 결과 테스트</Text>
            <Text style={styles.description}>실제 게임 로직이 연결되면 아래 테스트 제출부를 게임 종료 이벤트로 교체합니다.</Text>
          </AppCard>
          <View style={styles.actions}>
            <AppButton accessibilityLabel="95점 성공 결과 제출, Premium 조건" disabled={submitting} onPress={() => void finish(95, true)}>특별 조건 달성</AppButton>
            <AppButton accessibilityLabel="75점 성공 결과 제출, 일반 조건" disabled={submitting} onPress={() => void finish(75, true)} variant="secondary">일반 조건 달성</AppButton>
            <AppButton accessibilityLabel="20점 실패 결과 제출, 보상 없음" disabled={submitting} onPress={() => void finish(20, false)} variant="ghost">실패 결과</AppButton>
          </View>
          {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
        </>
      ) : (
        <AppCard accessible accessibilityLabel="게임 세션을 찾을 수 없습니다."><Text style={styles.description}>게임 세션을 찾을 수 없습니다.</Text></AppCard>
      )}
    </ScreenContainer>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  header: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backButton: { width: 32, height: 39, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  headerTitle: { ...typography.title1, color: colors.textPrimary },
  gameCard: { gap: spacing.sm },
  duration: { ...typography.caption, color: colors.primary },
  gameName: { ...typography.title2, color: colors.textPrimary },
  sectionTitle: { ...typography.title3, color: colors.textPrimary, marginBottom: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary },
  actions: { gap: spacing.sm },
  error: { ...typography.caption, color: colors.danger },
});
