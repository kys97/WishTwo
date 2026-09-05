import { getSupabaseClient } from '../../lib/supabase';
import type { MemoryImageInput, MemoryRecord, MemoryWriteInput } from './types';

interface MemoryRow {
  id: string;
  couple_id: string;
  author_id: string;
  memory_date: string;
  title: string;
  content: string;
  image_path: string;
}

async function getCoupleId(userId: string) {
  const { data, error } = await getSupabaseClient()
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId)
    .single<{ couple_id: string }>();
  if (error) throw error;
  return data.couple_id;
}

async function uploadImage(coupleId: string, userId: string, image: MemoryImageInput) {
  const extension = getExtension(image);
  const path = `${coupleId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const response = await fetch(image.uri);
  if (!response.ok) throw new Error('선택한 사진을 읽지 못했습니다.');
  const bytes = await response.arrayBuffer();
  const { error } = await getSupabaseClient().storage.from('memories').upload(path, bytes, {
    contentType: image.mimeType ?? `image/${extension}`,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

async function withSignedUrls(rows: MemoryRow[]): Promise<MemoryRecord[]> {
  if (rows.length === 0) return [];
  const { data, error } = await getSupabaseClient().storage
    .from('memories')
    .createSignedUrls(rows.map((row) => row.image_path), 60 * 60);
  if (error) throw error;
  return rows.map((row, index) => ({
    id: row.id,
    coupleId: row.couple_id,
    authorId: row.author_id,
    date: row.memory_date,
    title: row.title,
    summary: createSummary(row.content),
    content: row.content,
    imagePath: row.image_path,
    photoUrl: data[index]?.signedUrl ?? '',
    photoDescription: `${row.title} 추억 사진`,
  }));
}

export const memorySupabaseService = {
  async fetchMemories(userId: string) {
    const coupleId = await getCoupleId(userId);
    const { data, error } = await getSupabaseClient()
      .from('memories')
      .select('id,couple_id,author_id,memory_date,title,content,image_path')
      .eq('couple_id', coupleId)
      .is('deleted_at', null)
      .order('memory_date', { ascending: false });
    if (error) throw error;
    return withSignedUrls((data ?? []) as MemoryRow[]);
  },
  async createMemory(userId: string, input: MemoryWriteInput) {
    if (!input.image) throw new Error('사진을 선택해주세요.');
    const coupleId = await getCoupleId(userId);
    const imagePath = await uploadImage(coupleId, userId, input.image);
    const { data, error } = await getSupabaseClient()
      .from('memories')
      .insert({
        couple_id: coupleId,
        author_id: userId,
        memory_date: input.date,
        title: input.title,
        content: input.content,
        image_path: imagePath,
      })
      .select('id')
      .single<{ id: string }>();
    if (error) {
      await getSupabaseClient().storage.from('memories').remove([imagePath]);
      throw error;
    }
    return data.id;
  },
  async updateMemory(memory: MemoryRecord, input: MemoryWriteInput) {
    let nextImagePath = memory.imagePath;
    if (input.image) nextImagePath = await uploadImage(memory.coupleId, memory.authorId, input.image);
    const { error } = await getSupabaseClient()
      .from('memories')
      .update({
        memory_date: input.date,
        title: input.title,
        content: input.content,
        image_path: nextImagePath,
      })
      .eq('id', memory.id);
    if (error) {
      if (nextImagePath !== memory.imagePath) {
        await getSupabaseClient().storage.from('memories').remove([nextImagePath]);
      }
      throw error;
    }
    if (nextImagePath !== memory.imagePath) {
      await getSupabaseClient().storage.from('memories').remove([memory.imagePath]);
    }
  },
  async deleteMemory(memoryId: string) {
    const { error } = await getSupabaseClient().functions.invoke('delete-memory', {
      body: { memoryId },
    });
    if (error) throw error;
  },
};

function getExtension(image: MemoryImageInput) {
  const fromName = image.fileName?.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(fromName)) return fromName;
  const fromMime = image.mimeType?.split('/').pop()?.toLowerCase();
  return fromMime === 'jpeg' ? 'jpg' : fromMime || 'jpg';
}

function createSummary(content: string) {
  const trimmed = content.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}
