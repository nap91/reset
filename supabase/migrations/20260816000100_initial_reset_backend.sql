-- Reset MVP database, private photo storage, and per-user access controls.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.reset_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null check (goal in ('quick', 'guest', 'calm', 'function')),
  requested_minutes integer not null check (requested_minutes in (5, 10, 20)),
  estimated_minutes integer check (estimated_minutes between 1 and 20),
  room_type text,
  photo_path text,
  status text not null default 'draft' check (status in ('draft', 'analyzing', 'ready', 'active', 'completed', 'failed')),
  plan jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reset_sessions_user_created_idx on public.reset_sessions (user_id, created_at desc);

create table public.reset_tasks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reset_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null,
  instruction text not null,
  area text not null,
  estimated_seconds integer not null check (estimated_seconds between 15 and 1200),
  impact text not null check (impact in ('high', 'medium')),
  why_it_matters text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, position)
);

create index reset_tasks_session_position_idx on public.reset_tasks (session_id, position);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reset_sessions_set_updated_at
before update on public.reset_sessions
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.reset_sessions enable row level security;
alter table public.reset_tasks enable row level security;

create policy "Users can read their profile" on public.profiles for select using ((select auth.uid()) = id);
create policy "Users can read their sessions" on public.reset_sessions for select using ((select auth.uid()) = user_id);
create policy "Users can create their sessions" on public.reset_sessions for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their sessions" on public.reset_sessions for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their sessions" on public.reset_sessions for delete using ((select auth.uid()) = user_id);
create policy "Users can read their tasks" on public.reset_tasks for select using ((select auth.uid()) = user_id);
create policy "Users can create their tasks" on public.reset_tasks for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their tasks" on public.reset_tasks for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their tasks" on public.reset_tasks for delete using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('room-photos', 'room-photos', false, 10485760, array['image/jpeg', 'image/heic', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload their room photos" on storage.objects for insert to authenticated
with check (bucket_id = 'room-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can read their room photos" on storage.objects for select to authenticated
using (bucket_id = 'room-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can update their room photos" on storage.objects for update to authenticated
using (bucket_id = 'room-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'room-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can delete their room photos" on storage.objects for delete to authenticated
using (bucket_id = 'room-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

revoke all on public.profiles from anon;
revoke all on public.reset_sessions from anon;
revoke all on public.reset_tasks from anon;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.reset_sessions to authenticated;
grant select, insert, update, delete on public.reset_tasks to authenticated;
