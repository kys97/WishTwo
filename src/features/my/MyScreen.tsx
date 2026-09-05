import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { ProfileCard } from './components/ProfileCard';
import { SettingsMenu, type SettingsMenuItem } from './components/SettingsMenu';
import { useAuth } from '../auth';
import type { CoupleProfileViewData } from './types';

export function MyScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const profile: CoupleProfileViewData | null = user?.partner
    ? {
        me: {
          id: user.id,
          name: user.name,
          birthDate: user.birthDate,
          gender: user.gender,
          imageUrl: user.profileImageUrl,
          imageDescription: `${user.name}의 프로필 사진`,
        },
        partner: {
          id: user.partner.id,
          name: user.partner.name,
          birthDate: user.partner.birthDate,
          gender: user.partner.gender,
          imageUrl: user.partner.profileImageUrl,
          imageDescription: `${user.partner.name}의 프로필 사진`,
        },
        isConnected: user.isCoupleConnected,
        connectedAt: user.connectedAt ?? '',
      }
    : null;
  const menuItems: readonly SettingsMenuItem[] = [
    {
      id: 'connection',
      label: '연결 설정',
      icon: 'link-outline',
      onPress: () => router.push('/settings/connection'),
    },
    {
      id: 'notifications',
      label: '알림 설정',
      icon: 'notifications-outline',
      onPress: () => router.push('/settings/notifications'),
    },
    {
      id: 'app-settings',
      label: '앱 설정',
      icon: 'settings-outline',
      onPress: () => router.push('/settings/app'),
    },
    { id: 'terms', label: '이용약관', icon: 'document-text-outline' },
    { id: 'privacy', label: '개인정보처리방침', icon: 'shield-checkmark-outline' },
  ];

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      scroll
      contentContainerStyle={styles.container}
    >
      <Text accessibilityRole="header" style={styles.title}>마이</Text>
      {profile ? <ProfileCard profile={profile} /> : null}

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>설정 및 안내</Text>
        <SettingsMenu items={menuItems} />
      </View>

      <AppButton
        accessibilityHint="로그아웃하고 로그인 화면으로 이동합니다."
        accessibilityLabel="로그아웃"
        onPress={async () => {
          await logout();
          router.replace('/login');
        }}
        variant="ghost"
      >
        로그아웃
      </AppButton>
      <AppButton
        accessibilityHint="회원 탈퇴 확인 화면으로 이동합니다."
        accessibilityLabel="회원 탈퇴"
        onPress={() => router.push('/settings/delete-account')}
        variant="ghost"
      >
        회원 탈퇴
      </AppButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  title: { ...typography.display, color: colors.textPrimary },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.title3, color: colors.textPrimary },
});
