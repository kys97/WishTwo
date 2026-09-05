import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard, ScreenContainer } from '../../components';
import { colors, radius, spacing, typography } from '../../theme';
import { gameCategories, getRandomGame } from './mockData';
import { gameSupabaseService } from './supabaseService';
import type { GameCategory, GameCategoryId } from './types';

const categoryIcons: Record<GameCategoryId, keyof typeof Ionicons.glyphMap> = {
  'ten-seconds': 'flash-outline',
  'one-minute': 'timer-outline',
  'full-match': 'game-controller-outline',
  random: 'shuffle-outline',
};

export function GamesScreen() {
  const router = useRouter();
  const [startingRandom, setStartingRandom] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const openCategory = async (category: GameCategory) => {
    if (category.id === 'random') {
      const game = getRandomGame();
      setStartingRandom(true);
      setErrorMessage('');
      try {
        const playId = await gameSupabaseService.startGame(game.id);
        router.push(`/game/${game.id}?playId=${encodeURIComponent(playId)}` as Href);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '게임을 시작하지 못했습니다.');
      } finally {
        setStartingRandom(false);
      }
      return;
    }

    router.push({ pathname: '/games/[category]', params: { category: category.id } });
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      scroll
      contentContainerStyle={styles.container}
    >
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>게임</Text>
        <Text style={styles.subtitle}>오늘은 어떤 게임으로 승부해볼까요?</Text>
      </View>

      <View accessibilityLabel="게임 카테고리 4개" style={styles.categoryList}>
        {gameCategories.map((category) => (
          <Pressable
            accessibilityHint={
              category.id === 'random'
                ? '임의로 게임을 선택해 바로 시작합니다.'
                : `${category.title} 목록 화면으로 이동합니다.`
            }
            accessibilityLabel={`${category.title}, ${category.description}`}
            accessibilityRole="button"
            key={category.id}
            disabled={category.id === 'random' && startingRandom}
            onPress={() => void openCategory(category)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <AppCard elevated style={styles.categoryCard}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.iconContainer}
              >
                <Ionicons color={colors.primary} name={categoryIcons[category.id]} size={26} />
              </View>
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
              <Ionicons
                accessibilityElementsHidden
                color={colors.textMuted}
                importantForAccessibility="no-hide-descendants"
                name="chevron-forward"
                size={22}
              />
            </AppCard>
          </Pressable>
        ))}
      </View>
      {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  heading: { gap: spacing.xs },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
  categoryList: { gap: spacing.cardGap },
  categoryCard: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  categoryCopy: { flex: 1, gap: spacing.xxs },
  categoryTitle: { ...typography.title3, color: colors.textPrimary },
  categoryDescription: { ...typography.body, color: colors.textSecondary },
  pressed: { opacity: 0.7 },
  error: { ...typography.caption, color: colors.danger },
});
