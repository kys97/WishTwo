import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'NotoSansKR-Regular',
  medium: 'NotoSansKR-Medium',
  bold: 'NotoSansKR-Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 39,
  },
  title1: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  title2: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  title3: {
    fontFamily: fontFamily.medium,
    fontSize: 18,
    lineHeight: 27,
  },
  headline: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
