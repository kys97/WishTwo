import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const publishableKey = getPublishableKey();
const serviceRoleKey = getServiceRoleKey();

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'Unauthorized' }, 401);

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401);

  const userId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: profileFiles, error: profileFilesError }, { data: memories }] = await Promise.all([
    admin.storage.from('profile-images').list(userId, { limit: 1000 }),
    admin.from('memories').select('image_path').eq('author_id', userId),
  ]);
  if (profileFilesError) return json({ error: profileFilesError.message }, 500);

  const memoryPaths = (memories ?? []).map((item) => item.image_path).filter(Boolean);
  if (memoryPaths.length > 0) {
    const { error } = await admin.storage.from('memories').remove(memoryPaths);
    if (error) return json({ error: error.message }, 500);
  }
  const profilePaths = (profileFiles ?? []).map((file) => `${userId}/${file.name}`);
  if (profilePaths.length > 0) {
    const { error } = await admin.storage.from('profile-images').remove(profilePaths);
    if (error) return json({ error: error.message }, 500);
  }

  const { error: disconnectError } = await admin.rpc('archive_and_disconnect_user', {
    target_user_id: userId,
    disconnect_reason: 'account_deleted',
  });
  if (disconnectError) return json({ error: disconnectError.message }, 500);
  await admin.from('push_tokens').delete().eq('user_id', userId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return json({ error: deleteError.message }, 500);
  return json({ deleted: true });
});

function getPublishableKey() {
  const legacy = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacy) return legacy;
  const keys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  const value = keys ? JSON.parse(keys).default : null;
  if (!value) throw new Error('Supabase publishable key is not available.');
  return value as string;
}

function getServiceRoleKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  const value = keys ? JSON.parse(keys).default : null;
  if (!value) throw new Error('Supabase server secret is not available.');
  return value as string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
