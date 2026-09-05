import Ionicons from '@expo/vector-icons/Ionicons';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import type { MemoryRecord } from '../types';
import { MemoryRecordCard } from './MemoryRecordCard';

interface MemoryCalendarProps {
  year: number;
  month: number;
  memories: readonly MemoryRecord[];
  selectedDate: string | null;
  onChangeMonth: (offset: number) => void;
  onSelectDate: (date: string) => void;
  onOpenMemory: (memory: MemoryRecord) => void;
}

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function MemoryCalendar({
  year,
  month,
  memories,
  selectedDate,
  onChangeMonth,
  onSelectDate,
  onOpenMemory,
}: MemoryCalendarProps) {
  const cells = buildCalendarCells(year, month);
  const memoriesByDate = new Map(memories.map((memory) => [memory.date, memory]));
  const selectedMemories = memories.filter((memory) => memory.date === selectedDate);

  return (
    <View style={styles.section}>
      <AppCard padded={false} style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <Pressable
            accessibilityLabel="이전 달 보기"
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={() => onChangeMonth(-1)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.monthTitle}>
            {year}년 {month}월
          </Text>
          <Pressable
            accessibilityLabel="다음 달 보기"
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={() => onChangeMonth(1)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons color={colors.textPrimary} name="chevron-forward" size={22} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {weekdayLabels.map((label) => (
            <Text key={label} style={styles.weekday}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((date, index) => {
            if (!date) return <View key={`empty-${index}`} style={styles.cell} />;

            const isoDate = toIsoDate(date);
            const memory = memoriesByDate.get(isoDate);
            const selected = selectedDate === isoDate;
            const content = (
              <View style={[styles.cellContent, selected && styles.selectedCell]}>
                <Text style={[styles.day, memory && styles.photoDay]}>{date.getDate()}</Text>
              </View>
            );

            return (
              <Pressable
                accessibilityLabel={`${month}월 ${date.getDate()}일${memory ? `, 추억 기록 있음, ${memory.title}` : ', 추억 기록 없음'}${selected ? ', 선택됨' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={isoDate}
                onPress={() => onSelectDate(isoDate)}
                style={styles.cell}
              >
                {memory ? (
                  <ImageBackground
                    accessibilityElementsHidden
                    imageStyle={styles.cellImage}
                    importantForAccessibility="no-hide-descendants"
                    source={{ uri: memory.photoUrl }}
                    style={styles.imageBackground}
                  >
                    {content}
                  </ImageBackground>
                ) : (
                  content
                )}
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      {selectedDate ? (
        <View style={styles.selectedSection}>
          <Text accessibilityLabel={`${formatSelectedDate(selectedDate)}의 추억 기록`} style={styles.selectedTitle}>
            {formatSelectedDate(selectedDate)}
          </Text>
          {selectedMemories.length ? (
            selectedMemories.map((memory) => (
              <MemoryRecordCard key={memory.id} memory={memory} onPress={onOpenMemory} />
            ))
          ) : (
            <AppCard accessibilityLabel="이 날짜에는 추억 기록이 없습니다.">
              <Text style={styles.emptyText}>이 날짜에는 추억 기록이 없어요.</Text>
            </AppCard>
          )}
        </View>
      ) : null}
    </View>
  );
}

function buildCalendarCells(year: number, month: number) {
  const firstWeekday = new Date(year, month - 1, 1, 12).getDay();
  const daysInMonth = new Date(year, month, 0, 12).getDate();
  const cells: (Date | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month - 1, day, 12));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatSelectedDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(year, month - 1, day, 12));
}

const styles = StyleSheet.create({
  section: { gap: spacing.xl },
  calendarCard: { overflow: 'hidden', padding: spacing.md },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { ...typography.title2, color: colors.textPrimary },
  weekRow: { flexDirection: 'row', marginTop: spacing.lg },
  weekday: { ...typography.caption, color: colors.textSecondary, width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.88, padding: 2 },
  cellContent: { flex: 1, alignItems: 'center', paddingTop: spacing.xs, borderRadius: radius.xs },
  selectedCell: { borderWidth: 2, borderColor: colors.primary },
  day: { ...typography.caption, color: colors.textPrimary },
  photoDay: {
    color: colors.textInverse,
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxs,
  },
  imageBackground: { flex: 1 },
  cellImage: { borderRadius: radius.xs },
  selectedSection: { gap: spacing.sm },
  selectedTitle: { ...typography.headline, color: colors.textPrimary },
  emptyText: { ...typography.body, color: colors.textSecondary },
  pressed: { opacity: 0.6 },
});
