create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  birth_date date not null,
  gender text not null check (gender in ('남성', '여성')),
  profile_image_url text not null,
  connection_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  connected_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (couple_id, user_id),
  unique (user_id)
);

create or replace function public.create_unique_connection_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'WISH-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.profiles where connection_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, name, birth_date, gender, profile_image_url, connection_code
  ) values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    (new.raw_user_meta_data ->> 'birth_date')::date,
    new.raw_user_meta_data ->> 'gender',
    coalesce(new.raw_user_meta_data ->> 'profile_image_url', ''),
    public.create_unique_connection_code()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_couple_member(target_couple_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = target_couple_id and user_id = target_user_id
  );
$$;

create or replace function public.are_connected(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members first_member
    join public.couple_members second_member
      on second_member.couple_id = first_member.couple_id
    where first_member.user_id = first_user_id
      and second_member.user_id = second_user_id
  );
$$;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;

drop policy if exists profiles_select_self_or_partner on public.profiles;
create policy profiles_select_self_or_partner on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.are_connected(auth.uid(), id));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists couples_select_member on public.couples;
create policy couples_select_member on public.couples
  for select to authenticated
  using (public.is_couple_member(id, auth.uid()));

drop policy if exists couple_members_select_same_couple on public.couple_members;
create policy couple_members_select_same_couple on public.couple_members
  for select to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

create or replace function public.connect_with_code(input_partner_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  partner_user_id uuid;
  new_couple_id uuid;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  perform 1 from public.profiles where id = current_user_id for update;
  select id into partner_user_id
  from public.profiles
  where upper(profiles.connection_code) = upper(trim(input_partner_code))
  for update;

  if partner_user_id is null then
    raise exception '연결 코드를 확인해주세요.';
  end if;
  if partner_user_id = current_user_id then
    raise exception '내 연결 코드는 입력할 수 없습니다.';
  end if;
  if exists (select 1 from public.couple_members where user_id = current_user_id) then
    raise exception '이미 커플로 연결되어 있습니다.';
  end if;
  if exists (select 1 from public.couple_members where user_id = partner_user_id) then
    raise exception '상대방이 이미 다른 사용자와 연결되어 있습니다.';
  end if;

  insert into public.couples default values returning id into new_couple_id;
  insert into public.couple_members (couple_id, user_id)
  values (new_couple_id, current_user_id), (new_couple_id, partner_user_id);
  return new_couple_id;
end;
$$;

create or replace function public.get_my_partner()
returns table (
  id uuid,
  name text,
  birth_date date,
  gender text,
  profile_image_url text,
  connected_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.birth_date, p.gender, p.profile_image_url,
         c.connected_at
  from public.couple_members me
  join public.couple_members partner_member
    on partner_member.couple_id = me.couple_id
   and partner_member.user_id <> me.user_id
  join public.profiles p on p.id = partner_member.user_id
  join public.couples c on c.id = me.couple_id
  where me.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.create_unique_connection_code() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.is_couple_member(uuid, uuid) from public;
revoke all on function public.are_connected(uuid, uuid) from public;
revoke all on function public.connect_with_code(text) from public;
revoke all on function public.get_my_partner() from public;
grant execute on function public.is_couple_member(uuid, uuid) to authenticated;
grant execute on function public.are_connected(uuid, uuid) to authenticated;
grant execute on function public.connect_with_code(text) to authenticated;
grant execute on function public.get_my_partner() to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.couples to authenticated;
grant select on public.couple_members to authenticated;
