import type { WishTicketType } from '../features/wishes';

export type WishStatus = 'scheduled' | 'today' | 'awaitingConfirmation' | 'completed';

export interface Wish {
  id: string;
  ticketId: string;
  ticketType: WishTicketType;
  sender: {
    id: string;
    name: string;
  };
  recipientId: string;
  content: string;
  sentAt: string;
  scheduledFor: string;
  status: WishStatus;
}

export type ReceivedWish = Wish;

export const wishStatusLabels: Record<WishStatus, string> = {
  scheduled: '예정',
  today: '오늘 들어줘야 함',
  awaitingConfirmation: '사용자의 완료 확인 대기',
  completed: '완료',
};
