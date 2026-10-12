create table public.tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  issued_at timestamptz not null default now(),
  picture_complete boolean not null,
  comprehension_pass boolean not null,
  loans_count smallint not null check (loans_count between 1 and 4),
  signature text not null
);
alter table public.tokens enable row level security;
create policy "own select" on public.tokens for select using (auth.uid() = user_id);
create policy "own insert" on public.tokens for insert with check (auth.uid() = user_id);
-- no update, no delete policies

create or replace function public.token_aggregates()
returns table (sessions bigint, pct_complete numeric, pct_comprehension numeric)
language sql security definer set search_path = public as $$
  select count(*),
         round(100.0 * avg(picture_complete::int), 1),
         round(100.0 * avg(comprehension_pass::int), 1)
  from public.tokens;
$$;
revoke all on function public.token_aggregates() from public;
grant execute on function public.token_aggregates() to authenticated;
