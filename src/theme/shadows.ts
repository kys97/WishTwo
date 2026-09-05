import type { ViewStyle } from 'react-native';

import { colors } from './colors';

export const shadows = {
  none: {} as ViewStyle,
  card: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  } satisfies ViewStyle,
  raised: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  } satisfies ViewStyle,
} as const;
