import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from './AuthProvider';
import { AuthField } from './components/AuthField';

export function CoupleConnectScreen() {
  const router = useRouter(); const { user, connectCouple } = useAuth(); const [partnerCode, setPartnerCode] = useState(''); const [loading, setLoading] = useState(false); const [errorMessage, setErrorMessage] = useState('');
  const submit = async () => { setLoading(true); setErrorMessage(''); try { await connectCouple(partnerCode.trim().toUpperCase()); router.replace('/home'); } catch (error) { setErrorMessage(error instanceof Error ? error.message : '커플 연결에 실패했습니다.'); } finally { setLoading(false); } };
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}><ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}><View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>커플 연결</Text><Text style={styles.subtitle}>서로의 연결 코드를 입력하면 함께 시작할 수 있어요.</Text></View><AppCard accessible accessibilityLabel={`내 연결 코드 ${user?.connectionCode ?? ''}`} style={styles.codeCard}><Text style={styles.codeLabel}>내 연결 코드</Text><Text selectable style={styles.code}>{user?.connectionCode}</Text></AppCard><View style={styles.form}><AuthField autoCapitalize="characters" label="상대방 연결 코드" onChangeText={setPartnerCode} placeholder="WISH-0000" value={partnerCode} />{errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}<AppButton accessibilityLabel="커플 연결하기" disabled={!partnerCode.trim()} loading={loading} onPress={submit}>연결하기</AppButton></View></ScreenContainer></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, container: { justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.xxl }, heading: { gap: spacing.xs }, title: { ...typography.display, color: colors.textPrimary }, subtitle: { ...typography.body, color: colors.textSecondary }, codeCard: { alignItems: 'center', gap: spacing.xs }, codeLabel: { ...typography.bodyMedium, color: colors.textSecondary }, code: { ...typography.title1, color: colors.primary }, form: { gap: spacing.md }, error: { ...typography.caption, color: colors.danger } });
