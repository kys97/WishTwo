import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from './AuthProvider';
import { AuthField } from './components/AuthField';

export function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const { pendingCoupleCode, resendSignUpCode, verifySignUpCode } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const verify = async () => {
    if (!email) return;
    setLoading(true); setMessage('');
    try {
      const user = await verifySignUpCode(email, code.trim());
      router.replace(pendingCoupleCode ? { pathname: '/couple-connect', params: { code: pendingCoupleCode } } : user.isCoupleConnected ? '/home' : '/couple-connect');
    } catch (error) { setMessage(error instanceof Error ? error.message : '인증번호를 확인하지 못했습니다.'); }
    finally { setLoading(false); }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}><ScreenContainer edges={['top', 'bottom', 'left', 'right']} contentContainerStyle={styles.container}><View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>이메일 인증</Text><Text style={styles.description}>{email ?? '입력한 이메일'}로 받은 인증번호를 입력해주세요.</Text></View><View style={styles.form}><AuthField accessibilityHint="이메일로 받은 인증번호를 입력하세요." inputMode="numeric" label="인증번호" maxLength={8} onChangeText={setCode} value={code} />{message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}<AppButton accessibilityLabel="이메일 인증번호 확인" disabled={!email || code.trim().length < 6} loading={loading} onPress={() => void verify()}>확인</AppButton><AppButton accessibilityLabel="인증번호 다시 받기" disabled={!email || loading} onPress={() => { if (email) void resendSignUpCode(email).then(() => setMessage('인증번호를 다시 보냈습니다.')).catch((error) => setMessage(error instanceof Error ? error.message : '재전송하지 못했습니다.')); }} variant="ghost">인증번호 다시 받기</AppButton></View></ScreenContainer></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, container: { justifyContent: 'center', gap: spacing.xxl }, heading: { gap: spacing.xs }, title: { ...typography.display, color: colors.textPrimary }, description: { ...typography.body, color: colors.textSecondary }, form: { gap: spacing.md }, message: { ...typography.caption, color: colors.textSecondary } });
