import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from './AuthProvider';
import { AuthField } from './components/AuthField';
import { GenderRadioGroup } from './components/GenderRadioGroup';
import type { Gender } from './types';

export function SignUpScreen() {
  const router = useRouter(); const { signUp } = useAuth();
  const [name, setName] = useState(''); const [birthDate, setBirthDate] = useState(''); const [gender, setGender] = useState<Gender>('여성'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [loading, setLoading] = useState(false); const [errorMessage, setErrorMessage] = useState('');
  const matches = password.length > 0 && password === confirmation;
  const passwordValid = password.length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = Boolean(name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim()) && emailValid && passwordValid && matches);
  const submit = async () => { setLoading(true); setErrorMessage(''); try { await signUp({ name: name.trim(), birthDate: birthDate.trim(), gender, email: email.trim(), password }); router.push(`/verify-email?email=${encodeURIComponent(email.trim())}` as Href); } catch (error) { setErrorMessage(error instanceof Error ? error.message : '회원가입에 실패했습니다.'); } finally { setLoading(false); } };
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}><ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}><View style={styles.header}><Pressable accessibilityLabel="로그인 화면으로 돌아가기" accessibilityRole="button" hitSlop={spacing.sm} onPress={() => router.back()} style={styles.back}><Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" color={colors.textPrimary} name="arrow-back" size={24} /></Pressable><Text accessibilityRole="header" style={styles.title}>회원가입</Text></View><View style={styles.form}><AuthField label="이름" onChangeText={setName} value={name} /><AuthField label="생년월일" onChangeText={setBirthDate} placeholder="YYYY-MM-DD" value={birthDate} /><GenderRadioGroup onChange={setGender} value={gender} /><AuthField autoCapitalize="none" autoComplete="email" inputMode="email" label="이메일 아이디" onChangeText={setEmail} value={email} /><AuthField accessibilityHint="영문자와 숫자를 포함해 6자리 이상 입력하세요." label="비밀번호" onChangeText={setPassword} secureTextEntry value={password} />{password.length > 0 && !passwordValid ? <Text accessibilityLiveRegion="polite" style={styles.error}>영문자와 숫자를 포함해 6자리 이상 입력해주세요.</Text> : null}<AuthField accessibilityHint={confirmation.length > 0 && !matches ? '비밀번호가 일치하지 않습니다.' : undefined} label="비밀번호 확인" onChangeText={setConfirmation} secureTextEntry value={confirmation} />{confirmation.length > 0 && !matches ? <Text accessibilityLiveRegion="polite" style={styles.error}>비밀번호가 일치하지 않아요.</Text> : null}{errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}<AppButton accessibilityLabel="인증번호 받기" disabled={!canSubmit} loading={loading} onPress={submit}>인증번호 받기</AppButton></View></ScreenContainer></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, container: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl }, header: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, back: { width: 32, height: 39, alignItems: 'center', justifyContent: 'center' }, title: { ...typography.title1, color: colors.textPrimary }, form: { gap: spacing.md }, error: { ...typography.caption, color: colors.danger } });
