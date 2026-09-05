create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  wish_received boolean not null default true,
  wish_morning boolean not null default true,
  wish_confirmation boolean not null default true,
  game_reward boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create or replace function public.create_default_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_create_notification_preferences on public.profiles;
create trigger profiles_create_notification_preferences
  after insert on public.profiles
  for each row execute function public.create_default_notification_preferences();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
drop policy if exists notification_preferences_select_self on public.notification_preferences;
create policy notification_preferences_select_self on public.notification_preferences
  for select to authenticated using (user_id = auth.uid());
drop policy if exists notification_preferences_update_self on public.notification_preferences;
create policy notification_preferences_update_self on public.notification_preferences
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.notification_deliveries alter column wish_id drop not null;
alter table public.notification_deliveries
  add column if not exists game_reward_id uuid references public.game_rewards(id) on delete cascade;
alter table public.notification_deliveries
  drop constraint if exists notification_deliveries_notification_type_check;
alter table public.notification_deliveries
  add constraint notification_deliveries_notification_type_check check (
    notification_type in ('wish_received', 'wish_morning', 'wish_confirmation', 'game_reward')
  );
alter table public.notification_deliveries
  drop constraint if exists notification_deliveries_source_check;
alter table public.notification_deliveries
  add constraint notification_deliveries_source_check check (
    (wish_id is not null and game_reward_id is null)
    or (wish_id is null and game_reward_id is not null)
  );
create unique index if not exists notification_deliveries_game_reward_unique
  on public.notification_deliveries(game_reward_id, recipient_id, notification_type)
  where game_reward_id is not null;

create or replace function public.invoke_game_reward_notification_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  function_url text;
  webhook_secret text;
begin
  select decrypted_secret into function_url from vault.decrypted_secrets
  where name = 'notification_function_url' limit 1;
  select decrypted_secret into webhook_secret from vault.decrypted_secrets
  where name = 'notification_webhook_secret' limit 1;
  if function_url is null or webhook_secret is null then
    raise warning 'Push notification Vault secrets are not configured.';
    return new;
  end if;
  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notification-secret', webhook_secret),
    body := jsonb_build_object('source', 'game_reward', 'record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists game_rewards_send_push_notification on public.game_rewards;
create trigger game_rewards_send_push_notification
  after insert on public.game_rewards
  for each row execute function public.invoke_game_reward_notification_webhook();

revoke all on function public.create_default_notification_preferences() from public;
revoke all on function public.invoke_game_reward_notification_webhook() from public;
grant select, update on public.notification_preferences to authenticated;
