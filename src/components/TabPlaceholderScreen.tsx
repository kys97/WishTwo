import { StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { ScreenContainer } from './ScreenContainer';

export interface TabPlaceholderScreenProps {
  title: string;
}

export function TabPlaceholderScreen({ title }: TabPlaceholderScreenProps) {
  return (
    <ScreenContainer edges={['top', 'left', 'right']} contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xxxl,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
  },
});
