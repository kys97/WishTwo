import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton, AppCard, ScreenContainer } from '../../components';
import { colors, radius, spacing, typography } from '../../theme';
import { DatePickerField } from '../wish-request/components/DatePickerField';
import { useMemories } from './MemoryProvider';
import type { MemoryImageInput, MemoryRecord } from './types';

const TITLE_MAX_LENGTH = 60;
const CONTENT_MAX_LENGTH = 500;

interface MemoryFormScreenProps {
  memory?: MemoryRecord;
  loading?: boolean;
}

export function MemoryFormScreen({ memory, loading = false }: MemoryFormScreenProps) {
  const router = useRouter();
  const { createMemory, updateMemory } = useMemories();
  const [date, setDate] = useState<Date | null>(() => memory ? fromIsoDate(memory.date) : null);
  const [title, setTitle] = useState(memory?.title ?? '');
  const [content, setContent] = useState(memory?.content ?? '');
  const [image, setImage] = useState<MemoryImageInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const photoUri = image?.uri ?? memory?.photoUrl;
  const canSave = Boolean(date && title.trim() && content.trim() && photoUri) && !saving;

  const selectPhoto = async () => {
    setErrorMessage('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
    }
  };

  const saveMemory = async () => {
    if (!date || !canSave) return;
    setSaving(true);
    setErrorMessage('');
    const input = {
      date: toLocalIsoDate(date),
      title: title.trim(),
      content: content.trim(),
      image: image ?? undefined,
    };
    try {
      if (memory) {
        await updateMemory(memory, input);
        router.replace({ pathname: '/memory/[id]', params: { id: memory.id } });
      } else {
        await createMemory(input);
        router.replace({ pathname: '/memories', params: { focusDate: input.date } });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '추억 기록을 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !memory) {
    return (
      <ScreenContainer><Text style={styles.message}>추억 기록을 불러오는 중입니다.</Text></ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
      <ScreenContainer
        edges={['top', 'bottom', 'left', 'right']}
        scroll
        contentContainerStyle={styles.container}
        scrollViewProps={{ keyboardDismissMode: Platform.OS === 'ios' ? 'interactive' : 'on-drag' }}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="추억 화면으로 돌아가기" accessibilityRole="button" hitSlop={spacing.sm} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons accessibilityElementsHidden color={colors.textPrimary} importantForAccessibility="no-hide-descendants" name="arrow-back" size={24} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>{memory ? '추억 기록 수정' : '추억 기록 작성'}</Text>
        </View>

        <DatePickerField label="날짜" onChange={setDate} value={date} />
        <FormField label="제목">
          <TextInput accessibilityLabel="추억 제목" maxLength={TITLE_MAX_LENGTH} onChangeText={setTitle} placeholder="추억의 제목을 입력해 주세요" placeholderTextColor={colors.textMuted} style={styles.input} value={title} />
        </FormField>
        <FormField label="내용">
          <TextInput accessibilityLabel="추억 기록 내용" maxLength={CONTENT_MAX_LENGTH} multiline onChangeText={setContent} placeholder="함께한 순간을 기록해 주세요" placeholderTextColor={colors.textMuted} style={[styles.input, styles.contentInput]} textAlignVertical="top" value={content} />
        </FormField>
        <FormField label="사진">
          {photoUri ? (
            <AppCard accessible accessibilityLabel="선택된 추억 사진" padded={false} style={styles.photoCard}>
              <Image accessibilityElementsHidden importantForAccessibility="no-hide-descendants" resizeMode="cover" source={{ uri: photoUri }} style={styles.photo} />
              <View style={styles.photoMeta}><Ionicons accessibilityElementsHidden color={colors.primary} importantForAccessibility="no-hide-descendants" name="checkmark-circle" size={20} /><Text style={styles.photoSelected}>사진이 선택되었어요</Text></View>
            </AppCard>
          ) : (
            <AppCard accessible accessibilityLabel="선택된 사진이 없습니다." style={styles.photoPlaceholder}><Ionicons accessibilityElementsHidden color={colors.textMuted} importantForAccessibility="no-hide-descendants" name="image-outline" size={32} /><Text style={styles.photoPlaceholderText}>선택된 사진이 없어요</Text></AppCard>
          )}
          <AppButton accessibilityHint="기기의 갤러리에서 사진을 선택합니다." accessibilityLabel={photoUri ? '사진 다시 선택' : '사진 선택'} onPress={() => void selectPhoto()} variant="secondary">{photoUri ? '다시 선택' : '사진 선택'}</AppButton>
        </FormField>
        {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
        <AppButton accessibilityLabel={memory ? '추억 기록 수정 저장하기' : '추억 기록 저장하기'} accessibilityState={{ disabled: !canSave }} disabled={!canSave} loading={saving} onPress={() => void saveMemory()}>{memory ? '수정하기' : '저장하기'}</AppButton>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>;
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

const styles = StyleSheet.create({
  keyboardAvoidingView: { flex: 1, backgroundColor: colors.background },
  container: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  header: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backButton: { width: 32, height: 39, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  headerTitle: { ...typography.title1, color: colors.textPrimary },
  field: { gap: spacing.sm },
  label: { ...typography.headline, color: colors.textPrimary },
  input: { ...typography.body, minHeight: 52, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md },
  contentInput: { minHeight: 148 },
  photoCard: { overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surfaceMuted },
  photoMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.md },
  photoSelected: { ...typography.bodyMedium, color: colors.textPrimary },
  photoPlaceholder: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  photoPlaceholderText: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger },
  message: { ...typography.body, color: colors.textSecondary },
});
