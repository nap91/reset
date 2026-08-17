create table public.app_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (char_length(source) between 2 and 64),
  message text not null check (char_length(message) between 1 and 300),
  created_at timestamptz not null default now()
);

create index app_errors_user_created_idx on public.app_errors (user_id, created_at desc);
alter table public.app_errors enable row level security;
create policy "Users can create their error reports" on public.app_errors for insert with check ((select auth.uid()) = user_id);
create policy "Users can read their error reports" on public.app_errors for select using ((select auth.uid()) = user_id);
grant select, insert on public.app_errors to authenticated;
