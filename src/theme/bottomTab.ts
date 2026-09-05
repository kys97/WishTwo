import { colors } from './colors';
import { typography } from './typography';

export const bottomTab = {
  height: 70,
  itemCount: 5,
  iconSize: 24,
  iconLabelGap: 5,
  topPadding: 8,
  borderWidth: 1,
  horizontalPadding: 12,
  backgroundColor: colors.surface,
  borderColor: colors.border,
  activeColor: colors.primary,
  inactiveColor: colors.textMuted,
  labelStyle: typography.tabLabel,
} as const;
