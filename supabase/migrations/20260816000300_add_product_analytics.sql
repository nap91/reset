create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.reset_sessions(id) on delete cascade,
  event_name text not null check (char_length(event_name) between 2 and 64),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_name_created_idx on public.analytics_events (event_name, created_at desc);
create index analytics_events_user_created_idx on public.analytics_events (user_id, created_at desc);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.reset_sessions(id) on delete cascade,
  model text not null,
  status text not null check (status in ('succeeded', 'failed')),
  latency_ms integer not null check (latency_ms >= 0),
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  provider_request_id text,
  error_code text,
  created_at timestamptz not null default now()
);

create index ai_runs_user_created_idx on public.ai_runs (user_id, created_at desc);
create index ai_runs_status_created_idx on public.ai_runs (status, created_at desc);

alter table public.analytics_events enable row level security;
alter table public.ai_runs enable row level security;

create policy "Users can create their analytics events" on public.analytics_events for insert with check ((select auth.uid()) = user_id);
create policy "Users can read their analytics events" on public.analytics_events for select using ((select auth.uid()) = user_id);
create policy "Users can create their AI runs" on public.ai_runs for insert with check ((select auth.uid()) = user_id);
create policy "Users can read their AI runs" on public.ai_runs for select using ((select auth.uid()) = user_id);

grant select, insert on public.analytics_events to authenticated;
grant select, insert on public.ai_runs to authenticated;
