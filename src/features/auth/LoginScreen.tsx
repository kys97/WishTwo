import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from './AuthProvider';
import { AuthField } from './components/AuthField';
import { SocialContinueButtons } from './components/SocialContinueButtons';

export function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithSocial } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const canSubmit = email.trim().length > 0 && password.length > 0;

  const submit = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const user = await signIn(email.trim(), password);
      router.replace((!user.profileCompleted ? '/social-profile' : user.isCoupleConnected ? '/home' : '/couple-connect') as Href);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    } finally { setLoading(false); }
  };

  const continueWithSocial = async (provider: 'google' | 'kakao') => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signInWithSocial(provider);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '소셜 로그인에 실패했습니다.');
    } finally { setLoading(false); }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}><ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}><View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>다시 만나 반가워요</Text><Text style={styles.subtitle}>로그인하고 우리 둘의 소원을 이어가세요.</Text></View><View style={styles.form}><AuthField autoCapitalize="none" autoComplete="email" inputMode="email" label="이메일 아이디" onChangeText={setEmail} value={email} /><AuthField autoComplete="password" label="비밀번호" onChangeText={setPassword} secureTextEntry value={password} />{errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}<AppButton accessibilityLabel="이메일로 로그인" disabled={!canSubmit || loading} loading={loading} onPress={submit}>로그인</AppButton><View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>또는</Text><View style={styles.line} /></View><SocialContinueButtons disabled={loading} onContinue={(provider) => void continueWithSocial(provider)} /><AppButton accessibilityLabel="회원가입 화면으로 이동" disabled={loading} onPress={() => router.push('/signup')} variant="ghost">회원가입</AppButton></View></ScreenContainer></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, container: { justifyContent: 'center', gap: spacing.xxl, paddingVertical: spacing.xxl }, heading: { gap: spacing.xs }, title: { ...typography.display, color: colors.textPrimary }, subtitle: { ...typography.body, color: colors.textSecondary }, form: { gap: spacing.md }, error: { ...typography.caption, color: colors.danger }, divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, line: { flex: 1, height: 1, backgroundColor: colors.border }, dividerText: { ...typography.caption, color: colors.textMuted } });
