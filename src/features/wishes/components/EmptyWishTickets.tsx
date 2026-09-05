import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '../../../components';
import { colors, spacing, typography } from '../../../theme';

export function EmptyWishTickets() {
  return (
    <AppCard
      accessible
      accessibilityLabel="아직 보유한 소원권이 없어요."
      style={styles.card}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.icon}
      >
        <Ionicons color={colors.textMuted} name="ticket-outline" size={32} />
      </View>
      <Text style={styles.title}>아직 보유한 소원권이 없어요.</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 122,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 32,
    height: 32,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
