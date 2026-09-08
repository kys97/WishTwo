import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Share, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from './AuthProvider';
import { AuthField } from './components/AuthField';
import { isValidCoupleCode, normalizeCoupleCode } from './pendingCoupleCode';

export function CoupleConnectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const linkedCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const { clearPendingCoupleCode, connectCouple, isAuthenticated, isHydrated, pendingCoupleCode, savePendingCoupleCode, user } = useAuth();
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isHydrated) return;
    const candidate = linkedCode ?? pendingCoupleCode;
    if (!candidate) return;
    let active = true;
    const applyLinkedCode = async () => {
      if (!isValidCoupleCode(candidate)) {
        await Promise.resolve();
        if (active) setErrorMessage('올바르지 않은 연결 링크입니다. 연결 코드를 다시 확인해주세요.');
        return;
      }
      const normalized = normalizeCoupleCode(candidate);
      await savePendingCoupleCode(normalized);
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }
      if (!active) return;
      setPartnerCode(normalized);
      setErrorMessage('');
    };
    void applyLinkedCode();
    return () => { active = false; };
  }, [isAuthenticated, isHydrated, linkedCode, pendingCoupleCode, router, savePendingCoupleCode]);

  const shareMyCode = async () => {
    if (!user?.connectionCode) return;
    const url = `https://wishtwo.vercel.app/connect?code=${encodeURIComponent(user.connectionCode)}`;
    await Share.share({ message: `Wish Two에서 저와 연결해주세요!\n아래 링크를 누르면 연결할 수 있어요.\n${url}`, url });
  };

  const submit = async () => {
    const normalized = normalizeCoupleCode(partnerCode);
    if (!isValidCoupleCode(normalized)) {
      setErrorMessage('연결 코드는 WISH-XXXXXXXX 형식이어야 합니다.');
      return;
    }
    setLoading(true); setErrorMessage('');
    try {
      await connectCouple(normalized);
      await clearPendingCoupleCode();
      router.replace('/home');
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : '커플 연결에 실패했습니다.'); }
    finally { setLoading(false); }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}><ScreenContainer edges={['top', 'bottom', 'left', 'right']} scroll contentContainerStyle={styles.container}><View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>커플 연결</Text><Text style={styles.subtitle}>서로의 연결 코드를 입력하면 함께 시작할 수 있어요.</Text></View><AppCard accessible accessibilityLabel={`내 연결 코드 ${user?.connectionCode ?? ''}`} style={styles.codeCard}><Text style={styles.codeLabel}>내 연결 코드</Text><Text selectable style={styles.code}>{user?.connectionCode}</Text></AppCard>{user?.connectionCode ? <AppButton accessibilityLabel="내 연결 코드 공유하기" onPress={() => void shareMyCode()} variant="secondary">연결 코드 공유하기</AppButton> : null}<View style={styles.form}><AuthField accessibilityHint={partnerCode ? `자동 입력된 연결 코드 ${partnerCode}` : '상대방에게 받은 연결 코드를 입력하세요.'} autoCapitalize="characters" label="상대방 연결 코드" maxLength={13} onChangeText={(value) => setPartnerCode(value.toUpperCase())} placeholder="WISH-XXXXXXXX" value={partnerCode} />{errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}<AppButton accessibilityLabel="커플 연결하기" disabled={!isAuthenticated || !isValidCoupleCode(partnerCode)} loading={loading} onPress={submit}>연결하기</AppButton></View></ScreenContainer></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, container: { justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.xxl }, heading: { gap: spacing.xs }, title: { ...typography.display, color: colors.textPrimary }, subtitle: { ...typography.body, color: colors.textSecondary }, codeCard: { alignItems: 'center', gap: spacing.xs }, codeLabel: { ...typography.bodyMedium, color: colors.textSecondary }, code: { ...typography.title1, color: colors.primary }, form: { gap: spacing.md }, error: { ...typography.caption, color: colors.danger } });
