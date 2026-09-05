import type { ReceivedWish } from '../../types/wish';

export interface WishTicketBalance {
  standard: number;
  premium: number;
}

export interface CoupleMemberSummary {
  id: 'me' | 'partner';
  displayLabel: string;
  name: string;
  tickets: WishTicketBalance;
}

export interface HomeData {
  members: readonly [CoupleMemberSummary, CoupleMemberSummary];
  currentRequest: ReceivedWish | null;
}
