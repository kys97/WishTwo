import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '../../../theme';

export function AuthField({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={colors.textMuted} style={styles.input} {...props} /></View>;
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.bodyMedium, color: colors.textPrimary },
  input: { ...typography.body, minHeight: 52, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.textPrimary },
});
