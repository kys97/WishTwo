import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { AppCard } from './AppCard';
import { PremiumBadge } from './PremiumBadge';

export interface WishTicketCardProps {
  title: string;
  subtitle?: string;
  count?: number;
  icon?: ReactNode;
  premium?: boolean;
  footer?: ReactNode;
  accessibilityLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function WishTicketCard({
  title,
  subtitle,
  count,
  icon,
  premium = false,
  footer,
  accessibilityLabel,
  onPress,
  style,
}: WishTicketCardProps) {
  const content = (
    <AppCard style={[styles.card, premium && styles.premiumCard, style]}>
      <View
        accessible={!onPress && Boolean(accessibilityLabel)}
        accessibilityLabel={accessibilityLabel}
        style={styles.row}
      >
        {icon ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.icon}
          >
            {icon}
          </View>
        ) : null}
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {premium ? <PremiumBadge /> : null}
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {typeof count === 'number' ? <Text style={styles.count}>{count}장</Text> : null}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </AppCard>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 88, justifyContent: 'center' },
  premiumCard: { backgroundColor: colors.premiumBackground, borderColor: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  title: { ...typography.headline, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  count: { ...typography.bodyMedium, color: colors.textPrimary },
  footer: { marginTop: spacing.md },
});
