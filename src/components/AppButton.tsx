import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface AppButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  variant?: AppButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  children,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...pressableProps
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle =
    variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.ghost;
  const pressedStyle =
    variant === 'primary'
      ? styles.primaryPressed
      : variant === 'secondary'
        ? styles.secondaryPressed
        : styles.ghostPressed;
  const labelStyle =
    variant === 'primary'
      ? styles.primaryLabel
      : variant === 'secondary'
        ? styles.secondaryLabel
        : styles.ghostLabel;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyle,
        pressed && !isDisabled && pressedStyle,
        isDisabled && styles.disabled,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.primary} />
      ) : (
        <Text style={[styles.label, labelStyle, isDisabled && styles.disabledLabel]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  fullWidth: { width: '100%' },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed, borderColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.surface, borderColor: colors.primary },
  secondaryPressed: { backgroundColor: colors.primarySoft },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  ghostPressed: { backgroundColor: colors.primarySoft },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  label: typography.button,
  primaryLabel: { color: colors.textInverse },
  secondaryLabel: { color: colors.primary },
  ghostLabel: { color: colors.primary },
  disabledLabel: { color: colors.disabledText },
});
