import { getSupabaseClient } from '../../lib/supabase';
import type { Wish, WishStatus } from '../../types/wish';
import type { WishTicketType } from './types';

export interface TicketBalance {
  userId: string;
  normal: number;
  premium: number;
}

interface WishRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  ticket_type: WishTicketType;
  content: string;
  requested_at: string;
  scheduled_for: string;
  status: WishStatus;
  sender: { id: string; name: string } | { id: string; name: string }[];
}

function deriveStatus(status: WishStatus, scheduledFor: string): WishStatus {
  if (status === 'completed') return 'completed';
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (scheduledFor > todayValue) return 'scheduled';
  if (scheduledFor === todayValue) return 'today';
  return 'awaitingConfirmation';
}

function mapWish(row: WishRow): Wish {
  const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
  return {
    id: row.id,
    ticketId: `${row.sender_id}-${row.ticket_type}`,
    ticketType: row.ticket_type,
    sender,
    recipientId: row.recipient_id,
    content: row.content,
    sentAt: row.requested_at,
    scheduledFor: row.scheduled_for,
    status: deriveStatus(row.status, row.scheduled_for),
  };
}

export const wishSupabaseService = {
  async fetchBalances(userIds: string[]) {
    if (userIds.length === 0) return [];
    const { data, error } = await getSupabaseClient()
      .from('wish_ticket_balances')
      .select('user_id,ticket_type,quantity')
      .in('user_id', userIds);
    if (error) throw error;
    const balances = new Map<string, TicketBalance>();
    userIds.forEach((userId) => balances.set(userId, { userId, normal: 0, premium: 0 }));
    for (const row of (data ?? []) as { user_id: string; ticket_type: WishTicketType; quantity: number }[]) {
      const balance = balances.get(row.user_id);
      if (balance) {
        balance[row.ticket_type] = row.quantity;
      }
    }
    return [...balances.values()];
  },
  async fetchWishes(userId: string) {
    const { data, error } = await getSupabaseClient()
      .from('wishes')
      .select('id,sender_id,recipient_id,ticket_type,content,requested_at,scheduled_for,status,sender:profiles!wishes_sender_id_fkey(id,name)')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('requested_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as WishRow[]).map(mapWish);
  },
  async sendWish(ticketType: WishTicketType, content: string, scheduledFor: string) {
    const { data, error } = await getSupabaseClient().rpc('send_wish', {
      input_ticket_type: ticketType,
      input_content: content,
      input_scheduled_for: scheduledFor,
    });
    if (error) throw error;
    return data as string;
  },
  async completeWish(wishId: string) {
    const { error } = await getSupabaseClient().rpc('complete_wish', {
      input_wish_id: wishId,
    });
    if (error) throw error;
  },
};
