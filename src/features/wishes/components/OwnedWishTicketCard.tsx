import Ionicons from '@expo/vector-icons/Ionicons';

import { AppButton, WishTicketCard } from '../../../components';
import { colors } from '../../../theme';
import type { OwnedWishTicket } from '../types';

export interface OwnedWishTicketCardProps {
  ticket: OwnedWishTicket;
  onUse: (ticket: OwnedWishTicket) => void;
}

export function OwnedWishTicketCard({ ticket, onUse }: OwnedWishTicketCardProps) {
  const isPremium = ticket.type === 'premium';
  const title = isPremium ? 'Premium 소원권' : '일반 소원권';
  const availabilityLabel = ticket.isUsable ? `사용 가능, ${ticket.quantity}장 보유` : '현재 사용 불가';

  return (
    <WishTicketCard
      accessibilityLabel={`${title}, ${ticket.acquiredAtLabel}, ${availabilityLabel}`}
      footer={
        <AppButton
          accessibilityHint="소원 요청 작성 화면으로 이동합니다."
          accessibilityLabel={`${title} 사용하기`}
          disabled={!ticket.isUsable}
          onPress={() => onUse(ticket)}
          variant={isPremium ? 'primary' : 'secondary'}
        >
          {ticket.isUsable ? '사용하기' : '사용 불가'}
        </AppButton>
      }
      icon={
        <Ionicons
          color={isPremium ? colors.premium : colors.textSecondary}
          name={isPremium ? 'diamond-outline' : 'ticket-outline'}
          size={28}
        />
      }
      premium={isPremium}
      subtitle={`${ticket.acquiredAtLabel} · ${availabilityLabel}`}
      title={title}
    />
  );
}
