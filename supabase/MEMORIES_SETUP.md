# Memories backend setup

1. Apply `schema.sql` first, then run `memories.sql` in the Supabase SQL editor.
2. Deploy the author-only delete function:

   ```sh
   supabase functions deploy delete-memory
   ```

3. Keep the `memories` bucket private. `memories.sql` creates the bucket with a 10 MB limit and permits JPEG, PNG, WebP, HEIC, and HEIF images.
4. The mobile app continues to use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Never place a service-role/secret key in the app `.env` file.

The object path is `couple-id/author-id/file-name`. Storage and table RLS allow connected couple members to read, while only the author can create, update, or delete. Deletion runs server-side so the row and its Storage object are cleaned up together as safely as possible.
