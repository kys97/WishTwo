import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppCard } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { WISH_CONTENT_MAX_LENGTH } from '../types';

export interface WishContentFieldProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function WishContentField({ value, onChangeText }: WishContentFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>소원 내용</Text>
      <AppCard padded={false}>
        <TextInput
          accessibilityLabel="소원 내용"
          maxLength={WISH_CONTENT_MAX_LENGTH}
          multiline
          onChangeText={onChangeText}
          placeholder="어떤 소원을 부탁하고 싶나요?"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          style={styles.input}
          textAlignVertical="top"
          value={value}
        />
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 132,
    padding: spacing.md,
  },
});
