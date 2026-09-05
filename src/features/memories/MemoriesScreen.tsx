import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, ScreenContainer } from '../../components';
import { colors, radius, spacing, typography } from '../../theme';
import { MemoryCalendar } from './components/MemoryCalendar';
import { MemoryRecordCard } from './components/MemoryRecordCard';
import { useMemories } from './MemoryProvider';
import type { MemoryRecord, MemoryViewMode } from './types';

export function MemoriesScreen() {
  const router = useRouter();
  const { focusDate: focusDateParam } = useLocalSearchParams<{
    focusDate?: string | string[];
  }>();
  const focusDate = Array.isArray(focusDateParam) ? focusDateParam[0] : focusDateParam;
  const { errorMessage, loading, memories, refresh } = useMemories();
  const now = new Date();
  const [viewMode, setViewMode] = useState<MemoryViewMode>('calendar');
  const [visibleMonth, setVisibleMonth] = useState<{ year: number; month: number }>(
    { year: now.getFullYear(), month: now.getMonth() + 1 },
  );
  useFocusEffect(useCallback(() => {
    const timeout = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timeout);
  }, [refresh]));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ignoreFocusedDate, setIgnoreFocusedDate] = useState(false);
  const sortedMemories = [...memories].sort((a, b) => b.date.localeCompare(a.date));
  const focusedMonth = focusDate ? parseMonth(focusDate) : null;
  const calendarMonth = !ignoreFocusedDate && focusedMonth ? focusedMonth : visibleMonth;
  const calendarSelectedDate =
    selectedDate ?? (!ignoreFocusedDate && focusDate ? focusDate : null);

  const openMemory = (memory: MemoryRecord) => {
    router.push({ pathname: '/memory/[id]', params: { id: memory.id } });
  };

  const changeMonth = (offset: number) => {
    const date = new Date(calendarMonth.year, calendarMonth.month - 1 + offset, 1, 12);
    setVisibleMonth({ year: date.getFullYear(), month: date.getMonth() + 1 });
    setSelectedDate(null);
    setIgnoreFocusedDate(true);
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      scroll
      contentContainerStyle={styles.container}
    >
      <View style={styles.topRow}>
        <Text accessibilityRole="header" style={styles.title}>
          우리의 추억
        </Text>
        <AppButton
          accessibilityHint="추억 기록 작성 화면으로 이동합니다."
          accessibilityLabel="기록 추가"
          fullWidth={false}
          onPress={() => router.push('/memory/new')}
          style={styles.addButton}
        >
          기록 추가
        </AppButton>
      </View>

      <View accessibilityRole="tablist" style={styles.segmentedControl}>
        <ViewModeTab
          label="캘린더"
          onPress={() => setViewMode('calendar')}
          selected={viewMode === 'calendar'}
        />
        <ViewModeTab
          label="리스트"
          onPress={() => setViewMode('list')}
          selected={viewMode === 'list'}
        />
      </View>

      {viewMode === 'calendar' ? (
        <MemoryCalendar
          memories={memories}
          month={calendarMonth.month}
          onChangeMonth={changeMonth}
          onOpenMemory={openMemory}
          onSelectDate={setSelectedDate}
          selectedDate={calendarSelectedDate}
          year={calendarMonth.year}
        />
      ) : (
        <View accessibilityLabel={`추억 기록 ${sortedMemories.length}개`} style={styles.list}>
          {sortedMemories.map((memory) => (
            <MemoryRecordCard key={memory.id} memory={memory} onPress={openMemory} />
          ))}
        </View>
      )}
      {loading ? <Text style={styles.message}>추억 기록을 불러오고 있어요.</Text> : null}
      {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.message}>{errorMessage}</Text> : null}
    </ScreenContainer>
  );
}

function parseMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

interface ViewModeTabProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function ViewModeTab({ label, selected, onPress }: ViewModeTabProps) {
  return (
    <Pressable
      accessibilityLabel={`${label} 보기`}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        selected && styles.selectedSegment,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.segmentLabel, selected && styles.selectedSegmentLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  title: { ...typography.display, color: colors.textPrimary },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addButton: { minHeight: 44, paddingHorizontal: spacing.md },
  segmentedControl: {
    flexDirection: 'row',
    padding: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  segment: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  selectedSegment: { backgroundColor: colors.surface },
  segmentLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  selectedSegmentLabel: { color: colors.primary },
  pressed: { opacity: 0.7 },
  list: { gap: spacing.md },
  message: { ...typography.body, color: colors.textSecondary },
});
