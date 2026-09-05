import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AppCard } from '../../../components';
import { colors, spacing, typography } from '../../../theme';

export interface SettingsMenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export function SettingsMenu({ items }: { items: readonly SettingsMenuItem[] }) {
  return (
    <AppCard padded={false}>
      {items.map((item, index) => (
        <Pressable
          accessibilityHint={item.onPress ? `${item.label} 화면으로 이동합니다.` : undefined}
          accessibilityLabel={item.label}
          accessibilityRole="button"
          key={item.id}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.row,
            index < items.length - 1 && styles.divider,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.textSecondary}
            importantForAccessibility="no-hide-descendants"
            name={item.icon}
            size={22}
          />
          <Text style={styles.label}>{item.label}</Text>
          {item.onPress ? (
            <Ionicons
              accessibilityElementsHidden
              color={colors.textMuted}
              importantForAccessibility="no-hide-descendants"
              name="chevron-forward"
              size={20}
            />
          ) : null}
        </Pressable>
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { ...typography.bodyMedium, flex: 1, color: colors.textPrimary },
  pressed: { backgroundColor: colors.surfaceMuted },
});
