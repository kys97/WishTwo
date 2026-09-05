import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';

export function SettingsRouteScreen({ title }: { title: string }) {
  const router = useRouter();

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="마이 화면으로 돌아가기"
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
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      </View>
      <AppCard accessible accessibilityLabel={`${title}, 설정 기능 준비 중`}>
        <Text style={styles.placeholder}>설정 기능을 준비하고 있어요.</Text>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.sm },
  header: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backButton: { width: 32, height: 39, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  title: { ...typography.title1, color: colors.textPrimary },
  placeholder: { ...typography.bodyMedium, color: colors.textSecondary },
});
