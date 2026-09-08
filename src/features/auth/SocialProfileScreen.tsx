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
  const { completeSocialProfile, pendingCoupleCode, user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('여성');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const birthDateDigits = birthDate.replace(/\D/g, '');
  const birthDateComplete = birthDateDigits.length === 8;
  const birthDateValid = isValidBirthDate(birthDate);
  const canSubmit = Boolean(name.trim() && birthDateValid);

  const changeBirthDate = (value: string) => {
    setBirthDate(formatBirthDateInput(value));
  };

  const submit = async () => {
    setLoading(true); setErrorMessage('');
    try {
      const nextUser = await completeSocialProfile({ name: name.trim(), birthDate, gender });
      router.replace(pendingCoupleCode ? { pathname: '/couple-connect', params: { code: pendingCoupleCode } } : nextUser.isCoupleConnected ? '/home' : '/couple-connect');
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : '프로필을 저장하지 못했습니다.'); }
    finally { setLoading(false); }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}><ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}><View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>프로필 정보 입력</Text><Text style={styles.description}>커플 연결에 필요한 기본 정보만 입력해주세요.</Text></View><View style={styles.form}><AuthField label="이름" onChangeText={setName} value={name} /><AuthField accessibilityHint="생년월일 숫자 8자리를 입력하세요. 입력하면 연도 월 일 형식으로 자동 표시됩니다." inputMode="numeric" keyboardType="number-pad" label="생년월일" maxLength={10} onChangeText={changeBirthDate} placeholder="YYYY-MM-DD" value={birthDate} />{birthDateComplete && !birthDateValid ? <Text accessibilityLiveRegion="polite" style={styles.error}>실제 존재하는 날짜를 입력해주세요.</Text> : null}<GenderRadioGroup onChange={setGender} value={gender} />{errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}<AppButton accessibilityLabel="소셜 로그인 프로필 저장" disabled={!canSubmit} loading={loading} onPress={() => void submit()}>저장하고 계속하기</AppButton></View></ScreenContainer></KeyboardAvoidingView>;
}

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

function isLeapYear(year: number) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

const styles = StyleSheet.create({ flex: { flex: 1 }, container: { justifyContent: 'center', gap: spacing.xxl, paddingVertical: spacing.xxl }, heading: { gap: spacing.xs }, title: { ...typography.display, color: colors.textPrimary }, description: { ...typography.body, color: colors.textSecondary }, form: { gap: spacing.md }, error: { ...typography.caption, color: colors.danger } });
