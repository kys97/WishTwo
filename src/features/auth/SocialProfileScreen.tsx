import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from './AuthProvider';
import { AuthField } from './components/AuthField';
import { GenderRadioGroup } from './components/GenderRadioGroup';
import type { Gender } from './types';

export function SocialProfileScreen() {
  const router = useRouter();
  const { completeSocialProfile, user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('여성');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const canSubmit = Boolean(name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(birthDate));

  const submit = async () => {
    setLoading(true); setErrorMessage('');
    try {
      const nextUser = await completeSocialProfile({ name: name.trim(), birthDate, gender });
      router.replace(nextUser.isCoupleConnected ? '/home' : '/couple-connect');
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : '프로필을 저장하지 못했습니다.'); }
    finally { setLoading(false); }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}><ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}><View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>프로필 정보 입력</Text><Text style={styles.description}>커플 연결에 필요한 기본 정보만 입력해주세요.</Text></View><View style={styles.form}><AuthField label="이름" onChangeText={setName} value={name} /><AuthField label="생년월일" onChangeText={setBirthDate} placeholder="YYYY-MM-DD" value={birthDate} /><GenderRadioGroup onChange={setGender} value={gender} />{errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}<AppButton accessibilityLabel="소셜 로그인 프로필 저장" disabled={!canSubmit} loading={loading} onPress={() => void submit()}>저장하고 계속하기</AppButton></View></ScreenContainer></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, container: { justifyContent: 'center', gap: spacing.xxl, paddingVertical: spacing.xxl }, heading: { gap: spacing.xs }, title: { ...typography.display, color: colors.textPrimary }, description: { ...typography.body, color: colors.textSecondary }, form: { gap: spacing.md }, error: { ...typography.caption, color: colors.danger } });
