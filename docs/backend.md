# Reset backend

## Security model

- The mobile app uses a Supabase publishable key and an authenticated user session.
- MVP users start with anonymous authentication and can upgrade to a permanent account later.
- Row Level Security limits sessions, tasks, and photos to their owner.
- Room photos are stored in the private `room-photos` bucket under `<user-id>/<session-id>/...`.
- OpenAI and Supabase secret keys exist only in Supabase Edge Function secrets.

## Data model

- `profiles`: one row per authenticated user.
- `reset_sessions`: selected goal, time budget, photo path, plan, and session status.
- `reset_tasks`: ordered, trackable tasks returned by the AI engine.

## Local configuration

Copy `.env.example` to `.env` and set only the Supabase URL and publishable key. `.env` is ignored by Git.

## Deployment order

1. Link the local folder to the Supabase project.
2. Apply database migrations.
3. Enable anonymous sign-ins in the Supabase dashboard.
4. Add backend-only secrets.
5. Deploy the authenticated `analyze-room` Edge Function.
