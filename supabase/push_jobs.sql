create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- 먼저 Supabase Vault에 아래 두 이름으로 값을 등록해야 합니다.
-- notification_function_url: https://<project-ref>.supabase.co/functions/v1/dispatch-wish-notifications
-- notification_webhook_secret: Edge Function의 NOTIFICATION_WEBHOOK_SECRET와 동일한 임의 문자열

create or replace function public.invoke_wish_notification_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  function_url text;
  webhook_secret text;
begin
  select decrypted_secret into function_url
  from vault.decrypted_secrets where name = 'notification_function_url' limit 1;
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets where name = 'notification_webhook_secret' limit 1;

  if function_url is null or webhook_secret is null then
    raise warning 'Push notification Vault secrets are not configured.';
    return new;
  end if;

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notification-secret', webhook_secret
    ),
    body := jsonb_build_object('source', 'wish', 'record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists wishes_send_push_notification on public.wishes;
create trigger wishes_send_push_notification
  after insert on public.wishes
  for each row execute function public.invoke_wish_notification_webhook();

revoke all on function public.invoke_wish_notification_webhook() from public;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job
  where jobname = 'dispatch-wish-reminders' limit 1;
  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end;
$$;

select cron.schedule(
  'dispatch-wish-reminders',
  '* * * * *',
  $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
            where name = 'notification_function_url' limit 1),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notification-secret',
      (select decrypted_secret from vault.decrypted_secrets
       where name = 'notification_webhook_secret' limit 1)
    ),
    body := '{"mode":"scheduled"}'::jsonb
  );
  $cron$
);
