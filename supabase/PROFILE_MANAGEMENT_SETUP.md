# Profile and account management setup

1. Apply `schema.sql`, then `profile_management.sql` in the Supabase SQL editor.
2. Keep the generated `profile-images` bucket private.
3. Deploy the account deletion function:

   ```sh
   supabase functions deploy delete-account
   ```

The app uses only its publishable/anon key. The Edge Function receives the server secret from Supabase-managed function secrets.

## Data policy

- Disconnecting archives both sides of the connection in `couple_connection_history`, marks the couple disconnected, and removes only active `couple_members` rows. Existing wish and memory rows are retained.
- Deleting an account removes profile images and authored memory images first, archives an active connection, removes push tokens, then deletes the Auth user. Existing foreign-key cascades remove that user's profile, tickets, games, rewards, wishes involving that account, and authored memory rows. The former partner account and its own data remain.
