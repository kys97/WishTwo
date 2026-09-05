create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  device_id text not null,
  platform text not null check (platform in ('ios', 'android')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (
    notification_type in ('wish_received', 'wish_morning', 'wish_confirmation')
  ),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  expo_ticket_ids jsonb,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (wish_id, recipient_id, notification_type)
);

create index if not exists push_tokens_user_active_idx
  on public.push_tokens(user_id, active);
create index if not exists notification_deliveries_wish_idx
  on public.notification_deliveries(wish_id);

alter table public.push_tokens enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists push_tokens_select_self on public.push_tokens;
create policy push_tokens_select_self on public.push_tokens
  for select to authenticated using (user_id = auth.uid());

create or replace function public.register_push_token(
  input_expo_push_token text,
  input_device_id text,
  input_platform text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if input_platform not in ('ios', 'android') then
    raise exception '지원하지 않는 플랫폼입니다.';
  end if;

  delete from public.push_tokens
  where expo_push_token = input_expo_push_token
     or (user_id = auth.uid() and device_id = input_device_id);

  insert into public.push_tokens (
    user_id, expo_push_token, device_id, platform, active
  ) values (
    auth.uid(), input_expo_push_token, input_device_id, input_platform, true
  );
end;
$$;

create or replace function public.deactivate_push_token(input_device_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.push_tokens
  set active = false, updated_at = now()
  where user_id = auth.uid() and device_id = input_device_id;
$$;

revoke all on table public.push_tokens from anon, authenticated;
revoke all on table public.notification_deliveries from anon, authenticated;
revoke all on function public.register_push_token(text, text, text) from public;
revoke all on function public.deactivate_push_token(text) from public;
grant execute on function public.register_push_token(text, text, text) to authenticated;
grant execute on function public.deactivate_push_token(text) to authenticated;
grant select on public.push_tokens to authenticated;
