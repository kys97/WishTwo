alter table public.profiles add column if not exists profile_image_path text;
alter table public.couples add column if not exists status text not null default 'active'
  check (status in ('active', 'disconnected'));
alter table public.couples add column if not exists disconnected_at timestamptz;

create table if not exists public.couple_connection_history (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid references public.profiles(id) on delete set null,
  connected_at timestamptz not null,
  disconnected_at timestamptz not null,
  reason text not null check (reason in ('user_request', 'account_deleted')),
  primary key (couple_id, user_id)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-images', 'profile-images', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.archive_and_disconnect_user(target_user_id uuid, disconnect_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_couple_id uuid;
  target_connected_at timestamptz;
begin
  if disconnect_reason not in ('user_request', 'account_deleted') then
    raise exception '올바르지 않은 연결 해제 사유입니다.';
  end if;
  select cm.couple_id, c.connected_at into target_couple_id, target_connected_at
  from public.couple_members cm
  join public.couples c on c.id = cm.couple_id
  where cm.user_id = target_user_id
  for update of c;
  if target_couple_id is null then return; end if;

  insert into public.couple_connection_history (
    couple_id, user_id, partner_id, connected_at, disconnected_at, reason
  )
  select
    target_couple_id,
    member.user_id,
    partner.user_id,
    target_connected_at,
    now(),
    disconnect_reason
  from public.couple_members member
  left join public.couple_members partner
    on partner.couple_id = member.couple_id and partner.user_id <> member.user_id
  where member.couple_id = target_couple_id
  on conflict (couple_id, user_id) do nothing;

  update public.couples set status = 'disconnected', disconnected_at = now()
  where id = target_couple_id;
  delete from public.couple_members where couple_id = target_couple_id;
end;
$$;

create or replace function public.disconnect_my_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  perform public.archive_and_disconnect_user(auth.uid(), 'user_request');
end;
$$;

drop function if exists public.get_my_partner();
create function public.get_my_partner()
returns table (
  id uuid,
  name text,
  birth_date date,
  gender text,
  profile_image_url text,
  profile_image_path text,
  connected_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.birth_date, p.gender, p.profile_image_url,
         p.profile_image_path, c.connected_at
  from public.couple_members me
  join public.couple_members partner_member
    on partner_member.couple_id = me.couple_id and partner_member.user_id <> me.user_id
  join public.profiles p on p.id = partner_member.user_id
  join public.couples c on c.id = me.couple_id and c.status = 'active'
  where me.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_access_profile_object(object_name text, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1 from public.profiles owner
    where owner.id::text = (storage.foldername(object_name))[1]
      and (owner.id = target_user_id or public.are_connected(target_user_id, owner.id))
  );
$$;

alter table public.couple_connection_history enable row level security;
drop policy if exists connection_history_select_self on public.couple_connection_history;
create policy connection_history_select_self on public.couple_connection_history
  for select to authenticated using (user_id = auth.uid());

drop policy if exists profile_images_select_self_or_partner on storage.objects;
create policy profile_images_select_self_or_partner on storage.objects
  for select to authenticated using (
    bucket_id = 'profile-images'
    and public.can_access_profile_object(name, auth.uid())
  );

drop policy if exists profile_images_insert_self on storage.objects;
create policy profile_images_insert_self on storage.objects
  for insert to authenticated with check (
    bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists profile_images_delete_self on storage.objects;
create policy profile_images_delete_self on storage.objects
  for delete to authenticated using (
    bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

revoke all on function public.archive_and_disconnect_user(uuid, text) from public;
revoke all on function public.disconnect_my_couple() from public;
revoke all on function public.can_access_profile_object(text, uuid) from public;
revoke all on function public.get_my_partner() from public;
grant execute on function public.archive_and_disconnect_user(uuid, text) to service_role;
grant execute on function public.disconnect_my_couple() to authenticated;
grant execute on function public.can_access_profile_object(text, uuid) to authenticated;
grant execute on function public.get_my_partner() to authenticated;
grant select on public.couple_connection_history to authenticated;
