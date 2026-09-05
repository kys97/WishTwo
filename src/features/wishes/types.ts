export type WishTicketType = 'normal' | 'premium';

export interface OwnedWishTicket {
  id: string;
  type: WishTicketType;
  owned: boolean;
  acquiredAt: string;
  acquiredAtLabel: string;
  isUsable: boolean;
  quantity: number;
}
