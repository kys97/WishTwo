alter table public.profiles add column if not exists profile_completed boolean not null default true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_email_signup boolean := coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'email';
begin
  insert into public.profiles (
    id, name, birth_date, gender, profile_image_url, connection_code, profile_completed
  ) values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nickname', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'user_name', ''),
      nullif(new.raw_user_meta_data -> 'properties' ->> 'nickname', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      '사용자'
    ),
    case when coalesce(new.raw_user_meta_data ->> 'birth_date', '') ~ '^\d{4}-\d{2}-\d{2}$'
      then (new.raw_user_meta_data ->> 'birth_date')::date else date '1970-01-01' end,
    case when new.raw_user_meta_data ->> 'gender' in ('남성', '여성')
      then new.raw_user_meta_data ->> 'gender' else '여성' end,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'profile_image', ''),
      nullif(new.raw_user_meta_data ->> 'profile_image_url', ''),
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', ''),
      nullif(new.raw_user_meta_data -> 'properties' ->> 'profile_image', ''),
      ''
    ),
    public.create_unique_connection_code(),
    is_email_signup
  );
  insert into public.wish_ticket_balances (user_id, ticket_type, quantity)
  values (new.id, 'normal', 3), (new.id, 'premium', 1)
  on conflict (user_id, ticket_type) do nothing;
  return new;
end;
$$;

-- Supabase Dashboard > Authentication > URL Configuration의 Redirect URLs에
-- wishu://auth/callback 을 추가해야 합니다.
-- 이메일 확인 템플릿에는 링크 대신 {{ .Token }}을 표시해야 6자리 OTP 확인이 가능합니다.
