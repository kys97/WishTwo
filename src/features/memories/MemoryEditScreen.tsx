import { useLocalSearchParams } from 'expo-router';

import { MemoryFormScreen } from './MemoryFormScreen';
import { useMemories } from './MemoryProvider';

export function MemoryEditScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { memories, loading } = useMemories();
  const memory = memories.find((item) => item.id === id);

  return <MemoryFormScreen loading={loading} memory={memory} />;
}
