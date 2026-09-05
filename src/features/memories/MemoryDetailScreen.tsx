import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../auth';
import { useMemories } from './MemoryProvider';

export function MemoryDetailScreen() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { user } = useAuth();
  const { deleteMemory, loading, memories } = useMemories();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const memory = memories.find((item) => item.id === id);
  const canManage = memory?.authorId === user?.id;

  const handleDelete = async () => {
    if (!memory) return;
    setDeleting(true);
    setErrorMessage('');
    try {
      await deleteMemory(memory.id);
      router.replace('/memories');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '추억 기록을 삭제하지 못했습니다.');
      setDeleting(false);
    }
  };

  return (
    <ScreenContainer
      edges={['top', 'bottom', 'left', 'right']}
      scroll
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="추억 화면으로 돌아가기"
          accessibilityRole="button"
          hitSlop={spacing.sm}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.textPrimary}
            importantForAccessibility="no-hide-descendants"
            name="arrow-back"
            size={24}
          />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          추억 상세
        </Text>
      </View>

      {memory ? (
        <AppCard padded={false} style={styles.detailCard}>
          <Image
            accessible
            accessibilityLabel={`추억 사진, ${memory.photoDescription}`}
            resizeMode="cover"
            source={{ uri: memory.photoUrl }}
            style={styles.photo}
          />
          <View style={styles.copy}>
            <Text accessibilityLabel={`기록 날짜 ${formatDate(memory.date)}`} style={styles.date}>
              {formatDate(memory.date)}
            </Text>
            <Text accessibilityRole="header" style={styles.title}>
              {memory.title}
            </Text>
            <Text accessibilityLabel={`기록 내용 ${memory.content}`} style={styles.content}>
              {memory.content}
            </Text>
          </View>
        </AppCard>
      ) : loading ? (
        <Text accessibilityLiveRegion="polite" style={styles.emptyText}>추억 기록을 불러오는 중입니다.</Text>
      ) : (
        <AppCard accessible accessibilityLabel="추억 기록을 찾을 수 없습니다.">
          <Text style={styles.emptyText}>추억 기록을 찾을 수 없습니다.</Text>
        </AppCard>
      )}

      {memory && canManage ? (
        <View style={styles.actions}>
          <AppButton accessibilityLabel="이 추억 기록 수정하기" onPress={() => router.push('./edit')} variant="secondary">수정하기</AppButton>
          <AppButton accessibilityLabel="이 추억 기록 삭제하기" onPress={() => setConfirmingDelete(true)} variant="ghost">삭제하기</AppButton>
        </View>
      ) : null}

      {confirmingDelete && memory ? (
        <AppCard accessible accessibilityLabel="추억 기록 삭제 확인">
          <Text accessibilityRole="header" style={styles.confirmTitle}>이 추억을 삭제할까요?</Text>
          <Text style={styles.confirmCopy}>기록과 연결된 사진이 함께 삭제되며 되돌릴 수 없습니다.</Text>
          {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
          <View style={styles.confirmActions}>
            <AppButton accessibilityLabel="삭제 취소" disabled={deleting} onPress={() => setConfirmingDelete(false)} variant="secondary">취소</AppButton>
            <AppButton accessibilityLabel="추억 기록과 사진 삭제 확인" loading={deleting} onPress={() => void handleDelete()}>삭제</AppButton>
          </View>
        </AppCard>
      ) : null}
    </ScreenContainer>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(year, month - 1, day, 12));
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  header: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backButton: { width: 32, height: 39, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  headerTitle: { ...typography.title1, color: colors.textPrimary },
  detailCard: { overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surfaceMuted },
  copy: { gap: spacing.md, padding: spacing.lg },
  date: { ...typography.bodyMedium, color: colors.primary },
  title: { ...typography.title1, color: colors.textPrimary },
  content: { ...typography.body, color: colors.textSecondary },
  emptyText: { ...typography.bodyMedium, color: colors.textSecondary },
  actions: { gap: spacing.sm },
  confirmTitle: { ...typography.headline, color: colors.textPrimary },
  confirmCopy: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  confirmActions: { gap: spacing.sm, marginTop: spacing.lg },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});
