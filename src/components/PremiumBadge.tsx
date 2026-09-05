import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export interface PremiumBadgeProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function PremiumBadge({ label = 'Premium', style }: PremiumBadgeProps) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.premiumBackground,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  label: {
    ...typography.caption,
    color: colors.premium,
  },
});
