create table if not exists public.wish_ticket_balances (
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticket_type text not null check (ticket_type in ('normal', 'premium')),
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, ticket_type)
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  ticket_type text not null check (ticket_type in ('normal', 'premium')),
  content text not null check (char_length(content) between 1 and 100),
  requested_at timestamptz not null default now(),
  scheduled_for date not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'today', 'awaitingConfirmation', 'completed')),
  completed_at timestamptz,
  check (sender_id <> recipient_id)
);

create index if not exists wishes_sender_id_idx on public.wishes(sender_id);
create index if not exists wishes_recipient_id_idx on public.wishes(recipient_id);
create index if not exists wishes_scheduled_for_idx on public.wishes(scheduled_for);

insert into public.wish_ticket_balances (user_id, ticket_type, quantity)
select id, 'normal', 3 from public.profiles
on conflict (user_id, ticket_type) do nothing;

insert into public.wish_ticket_balances (user_id, ticket_type, quantity)
select id, 'premium', 1 from public.profiles
on conflict (user_id, ticket_type) do nothing;

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
  insert into public.wish_ticket_balances (user_id, ticket_type, quantity)
  values (new.id, 'normal', 3), (new.id, 'premium', 1);
  return new;
end;
$$;

alter table public.wish_ticket_balances enable row level security;
alter table public.wishes enable row level security;

drop policy if exists ticket_balances_select_self_or_partner on public.wish_ticket_balances;
create policy ticket_balances_select_self_or_partner on public.wish_ticket_balances
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.are_connected(auth.uid(), user_id)
  );

drop policy if exists wishes_select_participant on public.wishes;
create policy wishes_select_participant on public.wishes
  for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create or replace function public.send_wish(
  input_ticket_type text,
  input_content text,
  input_scheduled_for date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  partner_user_id uuid;
  current_quantity integer;
  new_wish_id uuid;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if input_ticket_type not in ('normal', 'premium') then
    raise exception '올바르지 않은 소원권 종류입니다.';
  end if;
  if char_length(trim(input_content)) not between 1 and 100 then
    raise exception '소원 내용은 1자 이상 100자 이하여야 합니다.';
  end if;
  if input_scheduled_for < (now() at time zone 'Asia/Seoul')::date then
    raise exception '과거 날짜는 선택할 수 없습니다.';
  end if;

  select partner_member.user_id into partner_user_id
  from public.couple_members me
  join public.couple_members partner_member
    on partner_member.couple_id = me.couple_id
   and partner_member.user_id <> me.user_id
  where me.user_id = current_user_id;

  if partner_user_id is null then
    raise exception '연결된 상대방이 없습니다.';
  end if;

  select quantity into current_quantity
  from public.wish_ticket_balances
  where user_id = current_user_id and ticket_type = input_ticket_type
  for update;

  if coalesce(current_quantity, 0) <= 0 then
    raise exception '보유한 소원권이 없습니다.';
  end if;

  update public.wish_ticket_balances
  set quantity = quantity - 1, updated_at = now()
  where user_id = current_user_id and ticket_type = input_ticket_type;

  insert into public.wishes (
    sender_id, recipient_id, ticket_type, content, scheduled_for, status
  ) values (
    current_user_id, partner_user_id, input_ticket_type,
    trim(input_content), input_scheduled_for, 'scheduled'
  ) returning id into new_wish_id;

  return new_wish_id;
end;
$$;

create or replace function public.complete_wish(input_wish_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes%rowtype;
begin
  select * into target_wish
  from public.wishes
  where id = input_wish_id
  for update;

  if target_wish.id is null then
    raise exception '소원을 찾을 수 없습니다.';
  end if;
  if target_wish.sender_id <> auth.uid() then
    raise exception '소원권을 사용한 사람만 완료할 수 있습니다.';
  end if;
  if target_wish.status = 'completed' then
    return;
  end if;
  if target_wish.scheduled_for >= (now() at time zone 'Asia/Seoul')::date then
    raise exception '실행 예정일이 지난 후 완료할 수 있습니다.';
  end if;

  update public.wishes
  set status = 'completed', completed_at = now()
  where id = input_wish_id;
end;
$$;

revoke all on function public.send_wish(text, text, date) from public;
revoke all on function public.complete_wish(uuid) from public;
grant execute on function public.send_wish(text, text, date) to authenticated;
grant execute on function public.complete_wish(uuid) to authenticated;
grant select on public.wish_ticket_balances to authenticated;
grant select on public.wishes to authenticated;
