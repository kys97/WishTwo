# Push notification setup

## 1. Database

Run these SQL files in order:

1. `schema.sql`
2. `wishes.sql`
3. `game_rewards.sql`
4. `push_notifications.sql`

Create two Vault secrets in the Supabase SQL editor:

```sql
select vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/dispatch-wish-notifications',
  'notification_function_url'
);

select vault.create_secret(
  'REPLACE_WITH_A_LONG_RANDOM_SECRET',
  'notification_webhook_secret'
);
```

Then run `push_jobs.sql` and finally `user_settings.sql`. The latter adds per-user preferences and the game reward notification trigger.

## 2. Edge Function

Set the same webhook secret on the Edge Function:

```sh
supabase secrets set NOTIFICATION_WEBHOOK_SECRET=REPLACE_WITH_THE_SAME_SECRET
```

If Expo push access-token security is enabled, also set:

```sh
supabase secrets set EXPO_ACCESS_TOKEN=YOUR_EXPO_ACCESS_TOKEN
```

Deploy the function:

```sh
supabase functions deploy dispatch-wish-notifications --no-verify-jwt
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied automatically by hosted Supabase Edge Functions. Never add the service-role key to the Expo app.

## 3. Expo

Add the EAS project UUID to the app `.env`:

```env
EXPO_PUBLIC_EAS_PROJECT_ID=YOUR_EAS_PROJECT_UUID
```

Configure APNs and FCM credentials in EAS, create a new native build, and install it on the test devices. A rebuild is required after adding `expo-notifications`.

## 4. Device test

1. Install the new build on two physical devices.
2. Sign in with two connected accounts and grant notification permission on both devices.
3. Send a wish from device A. Device B should receive the immediate notification; tapping it opens `/wish-detail/[id]`.
4. Use a wish whose scheduled date is today. The Cron dispatcher sends the recipient reminder from 09:00 KST and the sender confirmation from 22:00 KST. Tapping the latter opens `/wish-completion/[id]`.
5. Check `notification_deliveries` to verify each `(wish_id, recipient_id, notification_type)` appears only once.
6. Disable each preference in the app and verify the dispatcher returns `disabled` without inserting a delivery or calling Expo Push.
