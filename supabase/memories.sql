create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  memory_date date not null,
  title text not null check (char_length(title) between 1 and 60),
  content text not null check (char_length(content) between 1 and 500),
  image_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists memories_couple_date_idx
  on public.memories(couple_id, memory_date desc)
  where deleted_at is null;

drop trigger if exists memories_set_updated_at on public.memories;
create trigger memories_set_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memories',
  'memories',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_access_memory_object(
  object_name text,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id::text = (storage.foldername(object_name))[1]
      and user_id = target_user_id
  );
$$;

alter table public.memories enable row level security;

drop policy if exists memories_select_couple on public.memories;
create policy memories_select_couple on public.memories
  for select to authenticated
  using (
    deleted_at is null
    and public.is_couple_member(couple_id, auth.uid())
  );

drop policy if exists memories_insert_author on public.memories;
create policy memories_insert_author on public.memories
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.is_couple_member(couple_id, auth.uid())
  );

drop policy if exists memories_update_author on public.memories;
create policy memories_update_author on public.memories
  for update to authenticated
  using (author_id = auth.uid() and deleted_at is null)
  with check (
    author_id = auth.uid()
    and public.is_couple_member(couple_id, auth.uid())
  );

drop policy if exists memory_images_select_couple on storage.objects;
create policy memory_images_select_couple on storage.objects
  for select to authenticated
  using (
    bucket_id = 'memories'
    and public.can_access_memory_object(name, auth.uid())
  );

drop policy if exists memory_images_insert_author on storage.objects;
create policy memory_images_insert_author on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'memories'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.can_access_memory_object(name, auth.uid())
  );

drop policy if exists memory_images_delete_author on storage.objects;
create policy memory_images_delete_author on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'memories'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.can_access_memory_object(name, auth.uid())
  );

revoke all on function public.can_access_memory_object(text, uuid) from public;
grant execute on function public.can_access_memory_object(text, uuid) to authenticated;
grant select, insert, update on public.memories to authenticated;
