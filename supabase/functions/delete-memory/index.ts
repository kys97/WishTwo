import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = getPublishableKey();
const serviceRoleKey = getServiceRoleKey();

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'Unauthorized' }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401);

  const { memoryId } = await request.json();
  if (typeof memoryId !== 'string') return json({ error: 'memoryId is required' }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: memory, error: memoryError } = await admin
    .from('memories')
    .select('id,author_id,image_path')
    .eq('id', memoryId)
    .maybeSingle();
  if (memoryError) return json({ error: memoryError.message }, 500);
  if (!memory) return json({ deleted: true });
  if (memory.author_id !== userData.user.id) return json({ error: 'Forbidden' }, 403);

  const { error: markError } = await admin
    .from('memories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', memoryId);
  if (markError) return json({ error: markError.message }, 500);

  const { error: storageError } = await admin.storage.from('memories').remove([memory.image_path]);
  if (storageError) {
    await admin.from('memories').update({ deleted_at: null }).eq('id', memoryId);
    return json({ error: storageError.message }, 500);
  }

  const { error: deleteError } = await admin.from('memories').delete().eq('id', memoryId);
  if (deleteError) return json({ error: deleteError.message }, 500);
  return json({ deleted: true });
});

function getServiceRoleKey() {
  const legacyKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacyKey) return legacyKey;
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  const defaultKey = secretKeys ? JSON.parse(secretKeys).default : null;
  if (!defaultKey) throw new Error('Supabase server secret is not available.');
  return defaultKey as string;
}

function getPublishableKey() {
  const legacyKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacyKey) return legacyKey;
  const publishableKeys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  const defaultKey = publishableKeys ? JSON.parse(publishableKeys).default : null;
  if (!defaultKey) throw new Error('Supabase publishable key is not available.');
  return defaultKey as string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
