import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../auth';

export function DeleteAccountScreen() {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const confirmDelete = async () => {
    setDeleting(true);
    setErrorMessage('');
    try {
      await deleteAccount();
      router.replace('/login');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '회원 탈퇴를 처리하지 못했습니다.');
      setDeleting(false);
    }
  };
  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="마이 화면으로 돌아가기" accessibilityRole="button" hitSlop={spacing.sm} onPress={() => router.back()} style={styles.back}><Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" color={colors.textPrimary} name="arrow-back" size={24} /></Pressable>
        <Text accessibilityRole="header" style={styles.title}>회원 탈퇴</Text>
      </View>
      <AppCard accessible accessibilityLabel="정말 회원 탈퇴하시겠어요? 계정과 개인 데이터는 삭제되며 복구할 수 없습니다." style={styles.card}>
        <Text style={styles.question}>정말 회원 탈퇴하시겠어요?</Text>
        <Text style={styles.description}>인증 계정, 프로필, 푸시 토큰과 내가 만든 데이터가 삭제되며 복구할 수 없습니다.</Text>
        {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
        <AppButton accessibilityLabel="회원 탈퇴 취소" disabled={deleting} onPress={() => router.back()} variant="secondary">취소</AppButton>
        <AppButton accessibilityLabel="회원 탈퇴 최종 확인" loading={deleting} onPress={() => void confirmDelete()} variant="ghost">탈퇴 확인</AppButton>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.sm },
  header: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 32, height: 39, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title1, color: colors.textPrimary },
  card: { gap: spacing.md },
  question: { ...typography.title2, color: colors.textPrimary },
  description: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger },
});
