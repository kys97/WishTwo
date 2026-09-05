import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard, ScreenContainer } from '../../components';
import { colors, radius, spacing, typography } from '../../theme';
import { getGameCategory, getGamesByCategory } from './mockData';
import type { MockGame } from './types';
import { gameSupabaseService } from './supabaseService';

export function GameCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const categoryId = firstParam(params.category);
  const category = getGameCategory(categoryId);
  const isListCategory = category?.id !== 'random';
  const games = isListCategory ? getGamesByCategory(categoryId) : [];

  return (
    <ScreenContainer
      edges={['top', 'bottom', 'left', 'right']}
      scroll
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="게임 화면으로 돌아가기"
          accessibilityRole="button"
          hitSlop={spacing.sm}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.textPrimary}
            importantForAccessibility="no-hide-descendants"
            name="arrow-back"
            size={24}
          />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {category?.title ?? '게임 목록'}
        </Text>
      </View>

      {category && isListCategory ? (
        <>
          <View style={styles.heading}>
            <Text style={styles.description}>{category.description}</Text>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              준비된 게임 {games.length}개
            </Text>
          </View>
          <View accessibilityLabel={`${category.title} 게임 ${games.length}개`} style={styles.list}>
            {games.map((game) => <GameCard game={game} key={game.id} />)}
          </View>
          {games.length === 0 ? (
            <AppCard accessible accessibilityLabel="선택한 게임을 찾을 수 없습니다.">
              <Text style={styles.emptyText}>선택한 게임을 찾을 수 없습니다.</Text>
            </AppCard>
          ) : null}
        </>
      ) : (
        <AppCard accessible accessibilityLabel="게임 카테고리를 찾을 수 없습니다.">
          <Text style={styles.emptyText}>게임 카테고리를 찾을 수 없습니다.</Text>
        </AppCard>
      )}
    </ScreenContainer>
  );
}

function GameCard({ game }: { game: MockGame }) {
  const router = useRouter();
  const category = getGameCategory(game.category);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const start = async () => {
    setStarting(true);
    setErrorMessage('');
    try {
      const playId = await gameSupabaseService.startGame(game.id);
      router.push(`/game/${game.id}?playId=${encodeURIComponent(playId)}` as Href);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '게임을 시작하지 못했습니다.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.gameWrapper}>
      <Pressable accessibilityLabel={`${category?.title ?? '게임'}, ${game.name}, ${game.durationLabel}, 게임 시작`} accessibilityRole="button" disabled={starting} onPress={() => void start()} style={({ pressed }) => pressed && styles.pressed}>
        <AppCard style={styles.gameCard}>
          <View style={styles.gameTopRow}>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{game.durationLabel}</Text>
            </View>
            <Text style={styles.comingSoon}>{starting ? '시작 중' : '게임 시작'}</Text>
          </View>
          <Text style={styles.gameName}>{game.name}</Text>
          <Text style={styles.gameDescription}>{game.description}</Text>
        </AppCard>
      </Pressable>
      {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
    </View>
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
  heading: { gap: spacing.md },
  description: { ...typography.body, color: colors.textSecondary },
  sectionTitle: { ...typography.title2, color: colors.textPrimary },
  list: { gap: spacing.cardGap },
  gameWrapper: { gap: spacing.xs },
  gameCard: { gap: spacing.sm },
  gameTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  durationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  durationText: { ...typography.caption, color: colors.primary },
  comingSoon: { ...typography.caption, color: colors.textMuted },
  gameName: { ...typography.title3, color: colors.textPrimary },
  gameDescription: { ...typography.body, color: colors.textSecondary },
  emptyText: { ...typography.bodyMedium, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger },
});
