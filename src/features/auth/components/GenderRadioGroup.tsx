import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../../theme';
import type { Gender } from '../types';

export function GenderRadioGroup({ value, onChange }: { value: Gender; onChange: (value: Gender) => void }) {
  return <View accessibilityLabel="성별" accessibilityRole="radiogroup" style={styles.field}><Text style={styles.label}>성별</Text><View style={styles.row}>{(['남성', '여성'] as const).map((option) => { const selected = value === option; return <Pressable accessibilityLabel={option} accessibilityRole="radio" accessibilityState={{ checked: selected }} key={option} onPress={() => onChange(option)} style={[styles.option, selected && styles.selected]}><View style={[styles.circle, selected && styles.selectedCircle]}>{selected ? <View style={styles.inner} /> : null}</View><Text style={[styles.optionLabel, selected && styles.selectedLabel]}>{option}</Text></Pressable>; })}</View></View>;
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs }, label: { ...typography.bodyMedium, color: colors.textPrimary }, row: { flexDirection: 'row', gap: spacing.sm },
  option: { minHeight: 52, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, circle: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.textMuted, borderRadius: radius.pill }, selectedCircle: { borderColor: colors.primary }, inner: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.primary }, optionLabel: { ...typography.bodyMedium, color: colors.textSecondary }, selectedLabel: { color: colors.primary },
});
