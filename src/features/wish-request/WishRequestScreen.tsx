import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { useWishData, type WishTicketType } from '../wishes';
import { DatePickerField } from './components/DatePickerField';
import { SelectedTicketCard } from './components/SelectedTicketCard';
import { WishContentField } from './components/WishContentField';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isWishTicketType(value: string | undefined): value is WishTicketType {
  return value === 'normal' || value === 'premium';
}

export function WishRequestScreen() {
  const router = useRouter();
  const { ownedTickets, sendWish } = useWishData();
  const params = useLocalSearchParams<{ ticketId?: string; ticketType?: string }>();
  const ticketId = firstParam(params.ticketId);
  const ticketTypeParam = firstParam(params.ticketType);
  const ticketType = isWishTicketType(ticketTypeParam) ? ticketTypeParam : undefined;
  const selectedTicket = ownedTickets.find(
    (ticket) => ticket.id === ticketId && ticket.type === ticketType && ticket.isUsable,
  );
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const canSubmit = Boolean(selectedTicket && content.trim() && selectedDate);

  const handleSubmit = async () => {
    if (!selectedTicket || !selectedDate || !content.trim()) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await sendWish(selectedTicket.type, content.trim(), toLocalIsoDate(selectedDate));
      router.replace('/home');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '소원 요청을 보내지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScreenContainer
        edges={['top', 'bottom', 'left', 'right']}
        scroll
        contentContainerStyle={styles.container}
        scrollViewProps={{
          contentInsetAdjustmentBehavior: 'automatic',
          keyboardDismissMode: Platform.OS === 'ios' ? 'interactive' : 'on-drag',
        }}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="소원권 화면으로 돌아가기"
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            소원 요청
          </Text>
        </View>

        {selectedTicket ? (
          <>
            <SelectedTicketCard ticket={selectedTicket} />
            <WishContentField onChangeText={setContent} value={content} />
            <DatePickerField
              minimumDate={new Date()}
              onChange={setSelectedDate}
              value={selectedDate}
            />
            <AppButton
              accessibilityLabel="소원 요청 보내기"
              accessibilityState={{ disabled: !canSubmit }}
              disabled={!canSubmit || submitting}
              loading={submitting}
              onPress={handleSubmit}
            >
              소원 요청 보내기
            </AppButton>
            {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.submitError}>{errorMessage}</Text> : null}
          </>
        ) : (
          <View accessible accessibilityLabel="사용할 수 있는 소원권을 찾을 수 없습니다.">
            <Text style={styles.errorText}>사용할 수 있는 소원권을 찾을 수 없습니다.</Text>
          </View>
        )}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  header: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 32,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    ...typography.title1,
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  submitError: { ...typography.caption, color: colors.danger },
});
