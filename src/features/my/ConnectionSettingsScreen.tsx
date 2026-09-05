import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton, AppCard, ScreenContainer } from '../../components';
import { colors, radius, spacing, typography } from '../../theme';
import { useAuth } from '../auth';
import type { Gender } from '../auth';

export function ConnectionSettingsScreen() {
  const router = useRouter();
  const { disconnectCouple, updateProfile, user } = useAuth();
  const partner = user?.partner;
  const [name, setName] = useState(user?.name ?? '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '');
  const [gender, setGender] = useState(user?.gender ?? '여성');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState('');
  const canSave = Boolean(name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)) && !saving;

  const chooseImage = async () => {
    setMessage('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage('프로필 사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled) setSelectedImage(result.assets[0]);
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({
        name: name.trim(),
        birthDate,
        gender,
        image: selectedImage ? { uri: selectedImage.uri, fileName: selectedImage.fileName, mimeType: selectedImage.mimeType } : undefined,
      });
      setSelectedImage(null);
      setMessage('내 정보가 저장되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '내 정보를 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    setMessage('');
    try {
      await disconnectCouple();
      router.replace('/couple-connect');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '커플 연결을 해제하지 못했습니다.');
      setDisconnecting(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}>
      <Header title="연결 설정" onBack={() => router.back()} />

      <Text accessibilityRole="header" style={styles.sectionTitle}>내 정보</Text>
      <AppCard style={styles.card}>
        <ProfileImage uri={selectedImage?.uri ?? user?.profileImageUrl ?? ''} label={`${user?.name ?? '내'} 프로필 사진`} />
        <AppButton accessibilityLabel="내 프로필 사진 변경" onPress={() => void chooseImage()} variant="secondary">프로필 사진 변경</AppButton>
        <EditableField label="이름" value={name} onChangeText={setName} />
        <EditableField label="생년월일" value={birthDate} onChangeText={setBirthDate} />
        <GenderRadioGroup value={gender} onChange={setGender} />
        <AppButton accessibilityLabel="내 정보 저장하기" accessibilityState={{ disabled: !canSave }} disabled={!canSave} loading={saving} onPress={() => void save()}>저장하기</AppButton>
      </AppCard>

      <Text accessibilityRole="header" style={styles.sectionTitle}>상대방 정보</Text>
      <AppCard accessible accessibilityLabel={`상대방 정보, 이름 ${partner?.name ?? ''}, 생년월일 ${partner?.birthDate ?? ''}, 성별 ${partner?.gender ?? ''}`} style={styles.card}>
        <ProfileImage uri={partner?.profileImageUrl ?? ''} label={`${partner?.name ?? '상대방'} 프로필 사진`} />
        <ReadOnlyField label="이름" value={partner?.name ?? ''} />
        <ReadOnlyField label="생년월일" value={partner?.birthDate ?? ''} />
        <ReadOnlyField label="성별" value={partner?.gender ?? ''} />
      </AppCard>

      <Text accessibilityRole="header" style={styles.sectionTitle}>연결 정보</Text>
      <AppCard accessible accessibilityLabel={`연결된 날짜 ${user?.connectedAt ?? ''}, 현재 상태 ${user?.isCoupleConnected ? '연결됨' : '연결 안 됨'}`} style={styles.card}>
        <ReadOnlyField label="연결된 날짜" value={user?.connectedAt ?? ''} />
        <ReadOnlyField label="현재 연결 상태" value={user?.isCoupleConnected ? '연결됨' : '연결 안 됨'} />
        {!confirmDisconnect ? (
          <AppButton accessibilityLabel="커플 연결 해제 확인" onPress={() => setConfirmDisconnect(true)} variant="secondary">커플 연결 해제</AppButton>
        ) : (
          <View accessible accessibilityLabel="커플 연결을 해제할까요? 과거 기록은 삭제되지 않습니다." style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>커플 연결을 해제할까요?</Text>
            <Text style={styles.help}>두 사용자 모두 미연결 상태가 됩니다. 과거 소원과 추억 기록은 바로 삭제되지 않습니다.</Text>
            <AppButton accessibilityLabel="커플 연결 해제 확정" loading={disconnecting} onPress={() => void disconnect()}>연결 해제</AppButton>
            <AppButton accessibilityLabel="연결 해제 취소" disabled={disconnecting} onPress={() => setConfirmDisconnect(false)} variant="ghost">취소</AppButton>
          </View>
        )}
      </AppCard>
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
    </ScreenContainer>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={styles.header}><Pressable accessibilityLabel="마이 화면으로 돌아가기" accessibilityRole="button" hitSlop={spacing.sm} onPress={onBack} style={styles.back}><Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" color={colors.textPrimary} name="arrow-back" size={24} /></Pressable><Text accessibilityRole="header" style={styles.title}>{title}</Text></View>;
}

function ProfileImage({ uri, label }: { uri: string; label: string }) {
  return <Image accessible accessibilityLabel={label} source={{ uri }} style={styles.avatar} />;
}

function EditableField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={`내 ${label}`} onChangeText={onChangeText} style={styles.input} value={value} /></View>;
}

function GenderRadioGroup({ value, onChange }: { value: Gender; onChange: (value: Gender) => void }) {
  return (
    <View accessibilityLabel="내 성별" accessibilityRole="radiogroup" style={styles.field}>
      <Text style={styles.label}>성별</Text>
      <View style={styles.radioRow}>
        {(['남성', '여성'] as const).map((option) => {
          const selected = value === option;
          return (
            <Pressable
              accessibilityLabel={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={option}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.radioOption,
                selected && styles.radioOptionSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <View style={styles.readRow}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  header: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  back: { width: 32, height: 39, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title1, color: colors.textPrimary },
  sectionTitle: { ...typography.title3, color: colors.textPrimary, marginTop: spacing.sm },
  card: { gap: spacing.md },
  avatar: { width: 76, height: 76, alignSelf: 'center', borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  field: { gap: spacing.xs },
  label: { ...typography.bodyMedium, color: colors.textSecondary },
  input: { ...typography.body, minHeight: 48, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.textPrimary, backgroundColor: colors.surface },
  radioRow: { flexDirection: 'row', gap: spacing.sm },
  radioOption: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  radioOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radioOuter: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textMuted,
    borderRadius: radius.pill,
  },
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.primary },
  radioLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  radioLabelSelected: { color: colors.primary },
  pressed: { opacity: 0.7 },
  readRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  value: { ...typography.body, color: colors.textPrimary },
  confirmBox: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  confirmTitle: { ...typography.headline, color: colors.textPrimary },
  help: { ...typography.body, color: colors.textSecondary },
  message: { ...typography.caption, color: colors.textSecondary },
});
