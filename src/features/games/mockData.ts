import type { GameCategory, MockGame } from './types';

export const gameCategories: readonly GameCategory[] = [
  {
    id: 'ten-seconds',
    title: '10초 게임',
    description: '눈 깜짝할 사이에 승부를 정해요.',
  },
  {
    id: 'one-minute',
    title: '1분 게임',
    description: '짧고 가볍게 집중해서 즐겨요.',
  },
  {
    id: 'full-match',
    title: '제대로 한판',
    description: '조금 더 오래, 제대로 겨뤄봐요.',
  },
  {
    id: 'random',
    title: '랜덤게임',
    description: '무엇을 할지 고민되면 하나를 골라드려요.',
  },
] as const;

export const mockGames: readonly MockGame[] = [
  {
    id: 'quick-rock-paper-scissors',
    category: 'ten-seconds',
    name: '초고속 가위바위보',
    description: '준비 신호와 함께 한 번에 승부를 내요.',
    durationLabel: '약 10초',
  },
  {
    id: 'count-together',
    category: 'ten-seconds',
    name: '눈치 숫자 외치기',
    description: '같은 숫자를 외치지 않도록 서로의 타이밍을 읽어요.',
    durationLabel: '약 10초',
  },
  {
    id: 'speed-math',
    category: 'one-minute',
    name: '사칙연산 스피드',
    description: '제한 시간 동안 간단한 계산 문제를 풀어요.',
    durationLabel: '약 1분',
  },
  {
    id: 'word-chain',
    category: 'one-minute',
    name: '단어 이어 말하기',
    description: '주어진 주제에 맞춰 번갈아 단어를 말해요.',
    durationLabel: '약 1분',
  },
  {
    id: 'couple-balance',
    category: 'full-match',
    name: '커플 밸런스 대결',
    description: '여러 선택지를 고르며 서로의 취향을 맞혀봐요.',
    durationLabel: '약 5분',
  },
  {
    id: 'memory-cards',
    category: 'full-match',
    name: '기억력 카드 대결',
    description: '뒤집힌 카드의 위치를 기억해 더 많은 짝을 찾아요.',
    durationLabel: '약 10분',
  },
] as const;

export function getGameCategory(id: string | undefined) {
  return gameCategories.find((category) => category.id === id);
}

export function getGamesByCategory(category: string | undefined) {
  return mockGames.filter((game) => game.category === category);
}

export function getRandomGame() {
  return mockGames[Math.floor(Math.random() * mockGames.length)];
}
