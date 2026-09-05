export interface MemoryRecord {
  id: string;
  date: string;
  title: string;
  summary: string;
  content: string;
  photoUrl: string;
  photoDescription: string;
  imagePath: string;
  authorId: string;
  coupleId: string;
}

export interface MemoryImageInput {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export interface MemoryWriteInput {
  date: string;
  title: string;
  content: string;
  image?: MemoryImageInput;
}

export type MemoryViewMode = 'calendar' | 'list';
