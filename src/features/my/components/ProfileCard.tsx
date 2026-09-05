import { Image, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import type { CoupleProfileViewData } from '../types';

export function ProfileCard({ profile }: { profile: CoupleProfileViewData }) {
  const connectionLabel = profile.isConnected
    ? `${profile.partner.name}님과 커플로 연결됨`
    : '커플 연결 안 됨';

  return (
    <AppCard
      accessible
      accessibilityLabel={`내 프로필, ${profile.me.name}. 상대방 프로필, ${profile.partner.name}. ${connectionLabel}.`}
      elevated
      style={styles.card}
    >
      <Text style={styles.sectionLabel}>내 프로필</Text>
      <View style={styles.peopleRow}>
        <ProfilePerson label="나" profile={profile.me} />
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.connector}>
          <Text style={styles.heart}>♥</Text>
        </View>
        <ProfilePerson label="상대방" profile={profile.partner} />
      </View>
      <View style={styles.connectionStatus}>
        <View accessibilityElementsHidden style={styles.statusDot} />
        <Text style={styles.connectionText}>{connectionLabel}</Text>
      </View>
    </AppCard>
  );
}

function ProfilePerson({
  label,
  profile,
}: {
  label: string;
  profile: CoupleProfileViewData['me'];
}) {
  return (
    <View style={styles.person}>
      <Image
        accessible={false}
        accessibilityIgnoresInvertColors
        source={{ uri: profile.imageUrl }}
        style={styles.avatar}
      />
      <Text style={styles.personLabel}>{label}</Text>
      <Text style={styles.name}>{profile.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  sectionLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  peopleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  person: { flex: 1, alignItems: 'center', gap: spacing.xxs },
  avatar: {
    width: 72,
    height: 72,
    marginBottom: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  personLabel: { ...typography.caption, color: colors.textMuted },
  name: { ...typography.headline, color: colors.textPrimary },
  connector: { width: 44, alignItems: 'center' },
  heart: { ...typography.title2, color: colors.primary },
  connectionStatus: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  statusDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  connectionText: { ...typography.bodyMedium, color: colors.primary },
});
