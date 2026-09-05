import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';

export interface AppCardProps extends PropsWithChildren<Omit<ViewProps, 'style'>> {
  padded?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({
  children,
  padded = true,
  elevated = false,
  style,
  ...viewProps
}: AppCardProps) {
  return (
    <View
      style={[styles.base, padded && styles.padded, elevated && shadows.card, style]}
      {...viewProps}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  padded: { padding: spacing.md },
});
