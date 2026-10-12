-- Banco: avanzamento, verifiche e punti. Ogni utente vede e scrive solo le proprie righe.

create table public.module_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  module_key text not null,             -- materia/unita/modulo
  best_correct int not null check (best_correct >= 0),
  total int not null check (total > 0),
  attempts int not null default 1 check (attempts > 0),
  completed_at timestamptz,             -- primo mini test superato
  last_activity_at timestamptz not null default now(),
  primary key (user_id, module_key)
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  unit_key text not null,               -- materia/unita
  correct int not null check (correct >= 0),
  total int not null check (total > 0),
  grade numeric(3, 1) not null check (grade between 0 and 10),
  answers jsonb not null,               -- indice scelto per domanda, null se saltata
  duration_seconds int,
  points_awarded int not null default 0 check (points_awarded >= 0),
  created_at timestamptz not null default now()
);

create index test_attempts_user_unit on public.test_attempts (user_id, unit_key, created_at desc);

create table public.points_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('modulo', 'unita_superata', 'unita_padroneggiata', 'ripasso')),
  ref text not null,                    -- chiave del modulo/unità, o id del tentativo per i ripassi
  points int not null check (points > 0),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)           -- ogni premio si prende una volta sola
);

alter table public.module_progress enable row level security;
alter table public.test_attempts enable row level security;
alter table public.points_events enable row level security;

create policy "module_progress: proprie righe" on public.module_progress
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "test_attempts: lettura proprie" on public.test_attempts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "test_attempts: inserimento proprie" on public.test_attempts
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "points_events: lettura proprie" on public.points_events
  for select to authenticated using (user_id = (select auth.uid()));
create policy "points_events: inserimento proprie" on public.points_events
  for insert to authenticated with check (user_id = (select auth.uid()));
