import { createClient } from 'npm:@supabase/supabase-js@2';

type NotificationType = 'wish_received' | 'wish_morning' | 'wish_confirmation' | 'game_reward';

interface WishRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  scheduled_for: string;
  status: string;
}

interface Candidate {
  sourceId: string;
  wishId?: string;
  gameRewardId?: string;
  playId?: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  route: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = getServiceRoleKey();
const notificationSecret = Deno.env.get('NOTIFICATION_WEBHOOK_SECRET')!;
const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function getServiceRoleKey() {
  const legacyKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacyKey) return legacyKey;
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  const defaultKey = secretKeys ? JSON.parse(secretKeys).default : null;
  if (!defaultKey) throw new Error('Supabase server secret is not available.');
  return defaultKey as string;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
  if (!notificationSecret || request.headers.get('x-notification-secret') !== notificationSecret) {
    return response({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const candidates = payload?.record?.id
      ? payload.source === 'game_reward'
        ? await gameRewardCandidate(payload.record.id as string)
        : await immediateWishCandidate(payload.record.id as string)
      : await scheduledCandidates();
    const results = [];
    for (const candidate of candidates) results.push(await deliver(candidate));
    return response({ processed: results.length, results });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

async function immediateWishCandidate(wishId: string): Promise<Candidate[]> {
  const wish = await getWish(wishId);
  if (!wish) return [];
  return [{
    sourceId: wish.id,
    wishId: wish.id,
    recipientId: wish.recipient_id,
    type: 'wish_received',
    title: 'Wish-U',
    body: '상대가 소원을 요청했습니다.',
    route: `/wish-detail/${wish.id}`,
  }];
}

async function gameRewardCandidate(rewardId: string): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from('game_rewards')
    .select('id,user_id,ticket_type,game_play_id')
    .eq('id', rewardId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return [];
  return [{
    sourceId: data.id,
    gameRewardId: data.id,
    playId: data.game_play_id,
    recipientId: data.user_id,
    type: 'game_reward',
    title: 'Wish-U',
    body: data.ticket_type === 'premium' ? 'Premium 소원권을 획득했습니다.' : '일반 소원권을 획득했습니다.',
    route: `/game-result/${data.game_play_id}`,
  }];
}

async function scheduledCandidates(): Promise<Candidate[]> {
  const { date, hour } = koreaNow();
  const { data, error } = await supabase
    .from('wishes')
    .select('id,sender_id,recipient_id,content,scheduled_for,status')
    .eq('scheduled_for', date)
    .neq('status', 'completed');
  if (error) throw error;

  const candidates: Candidate[] = [];
  for (const wish of (data ?? []) as WishRow[]) {
    if (hour >= 9 && hour < 22) {
      candidates.push({
        sourceId: wish.id,
        wishId: wish.id,
        recipientId: wish.recipient_id,
        type: 'wish_morning',
        title: 'Wish-U',
        body: '오늘 상대방의 소원을 들어주는 날입니다.',
        route: `/wish-detail/${wish.id}`,
      });
    }
    if (hour >= 22) {
      candidates.push({
        sourceId: wish.id,
        wishId: wish.id,
        recipientId: wish.sender_id,
        type: 'wish_confirmation',
        title: 'Wish-U',
        body: '상대방이 오늘 소원을 들어주었나요?',
        route: `/wish-completion/${wish.id}`,
      });
    }
  }
  return candidates;
}

async function getWish(wishId: string) {
  const { data, error } = await supabase
    .from('wishes')
    .select('id,sender_id,recipient_id,content,scheduled_for,status')
    .eq('id', wishId)
    .maybeSingle<WishRow>();
  if (error) throw error;
  return data;
}

async function deliver(candidate: Candidate) {
  const preferenceColumn: Record<NotificationType, string> = {
    wish_received: 'wish_received',
    wish_morning: 'wish_morning',
    wish_confirmation: 'wish_confirmation',
    game_reward: 'game_reward',
  };
  const { data: preferences, error: preferenceError } = await supabase
    .from('notification_preferences')
    .select(preferenceColumn[candidate.type])
    .eq('user_id', candidate.recipientId)
    .maybeSingle();
  if (preferenceError) throw preferenceError;
  if (preferences?.[preferenceColumn[candidate.type]] === false) {
    return { sourceId: candidate.sourceId, type: candidate.type, status: 'disabled' };
  }

  const { data: tokenRows, error: tokenError } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', candidate.recipientId)
    .eq('active', true);
  if (tokenError) throw tokenError;
  const tokens = (tokenRows ?? []).map((row) => row.expo_push_token as string);
  if (tokens.length === 0) return { sourceId: candidate.sourceId, type: candidate.type, status: 'no_tokens' };

  const { data: delivery, error: claimError } = await supabase
    .from('notification_deliveries')
    .insert({
      wish_id: candidate.wishId ?? null,
      game_reward_id: candidate.gameRewardId ?? null,
      recipient_id: candidate.recipientId,
      notification_type: candidate.type,
      status: 'pending',
    })
    .select('id')
    .single();
  if (claimError?.code === '23505') {
    return { sourceId: candidate.sourceId, type: candidate.type, status: 'duplicate' };
  }
  if (claimError) throw claimError;

  try {
    const ticketIds: string[] = [];
    for (const tokenChunk of chunks(tokens, 100)) {
      const messages = tokenChunk.map((to) => ({
        to,
        title: candidate.title,
        body: candidate.body,
        sound: 'default',
        channelId: 'wish-reminders',
        data: {
          notificationType: candidate.type,
          wishId: candidate.wishId,
          playId: candidate.playId,
          route: candidate.route,
        },
      }));
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (expoAccessToken) headers.Authorization = `Bearer ${expoAccessToken}`;
      const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });
      if (!expoResponse.ok) throw new Error(`Expo push request failed: ${expoResponse.status}`);
      const result = await expoResponse.json();
      const tickets = Array.isArray(result.data) ? result.data : [result.data];
      for (let index = 0; index < tickets.length; index += 1) {
        const ticket = tickets[index];
        if (ticket?.id) ticketIds.push(ticket.id);
        if (ticket?.details?.error === 'DeviceNotRegistered') {
          await supabase
            .from('push_tokens')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('expo_push_token', tokenChunk[index]);
        }
      }
    }
    await supabase
      .from('notification_deliveries')
      .update({ status: 'sent', expo_ticket_ids: ticketIds, delivered_at: new Date().toISOString() })
      .eq('id', delivery.id);
    return { sourceId: candidate.sourceId, type: candidate.type, status: 'sent' };
  } catch (error) {
    await supabase.from('notification_deliveries').delete().eq('id', delivery.id);
    throw error;
  }
}

function koreaNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, hour: Number(value.hour) };
}

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
