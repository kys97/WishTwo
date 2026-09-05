# Email OTP and social auth setup

Apply `auth_flow.sql` after both `schema.sql` and `wishes.sql`. It replaces the signup trigger while preserving initial ticket balances.

## Email verification code

In Supabase Dashboard:

1. Enable email confirmations under Authentication settings.
2. Edit the Confirm signup email template so the message displays `{{ .Token }}`. This sends the OTP that the app verifies with `verifyOtp(type: 'signup')`.
3. Keep the minimum password length at 6 or higher. The app additionally requires at least one English letter and one number.

## Redirect URL

Add this exact redirect URL under Authentication > URL Configuration > Redirect URLs:

```text
wishu://auth/callback
```

## Google and Kakao

Enable Google and Kakao under Authentication > Providers and enter each provider's client credentials. In the Google Cloud and Kakao developer consoles, use the Supabase callback URL shown by the provider settings, normally:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

The native app returns from Supabase through `wishu://auth/callback`. OAuth users who do not provide birth date and gender are sent to the profile completion screen before couple connection.

Kakao email is optional. The database profile is keyed by the Auth user UUID, not email, and initializes the display name/image from Kakao `nickname`, `profile_image`, `avatar_url`, or compatible metadata when present.
