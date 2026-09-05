export const colors = {
  background: '#F8F7FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F0F7',
  primary: '#6D5BD0',
  primaryPressed: '#5B49BF',
  primarySoft: '#EEEAFB',
  textPrimary: '#211F26',
  textSecondary: '#6F6B78',
  textMuted: '#96919E',
  textInverse: '#FFFFFF',
  border: '#E8E4ED',
  disabled: '#D3CEDA',
  disabledText: '#8F8998',
  danger: '#D94F5C',
  premium: '#6D5BD0',
  premiumBackground: '#EEEAFB',
  overlay: 'rgba(33, 31, 38, 0.44)',
} as const;

export type AppColor = keyof typeof colors;
