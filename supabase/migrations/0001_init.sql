-- Universidade UCMB - estrutura inicial do banco
-- Como usar: Supabase > SQL Editor > New query > cole TUDO isto > Run.
-- Pode rodar mais de uma vez sem problema.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('aluno', 'gestor');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Pessoas (1 linha por usuário que existe no login do Supabase)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  full_name    text not null,
  role         user_role not null default 'aluno',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Conteúdo: módulos, aulas, perguntas, materiais
-- ---------------------------------------------------------------------------
create table if not exists public.modules (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  position   int  not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.modules (id) on delete cascade,
  title            text not null,
  youtube_id       text not null,
  duration_seconds int  not null default 0 check (duration_seconds >= 0),
  position         int  not null,
  created_at       timestamptz not null default now(),
  unique (module_id, position)
);

-- 9 perguntas por aula: 3 conjuntos (1, 2, 3) com 3 perguntas cada.
-- A tentativa N do aluno usa o conjunto N, então as perguntas nunca se repetem.
create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null references public.lessons (id) on delete cascade,
  question_set  smallint not null check (question_set between 1 and 3),
  position      smallint not null check (position between 1 and 3),
  prompt        text  not null,
  options       jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_index smallint not null check (correct_index >= 0),
  unique (lesson_id, question_set, position)
);

create table if not exists public.lesson_materials (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons (id) on delete cascade,
  title        text not null,
  storage_path text not null unique,
  size_bytes   bigint not null default 0,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Acompanhamento do aluno
-- ---------------------------------------------------------------------------
-- ranges = trechos realmente assistidos, ex.: [[0,120],[300,420]] (em segundos).
create table if not exists public.watch_progress (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  lesson_id       uuid not null references public.lessons (id) on delete cascade,
  ranges          jsonb not null default '[]'::jsonb,
  watched_seconds int   not null default 0,
  last_position   int   not null default 0,
  completed_at    timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  lesson_id      uuid not null references public.lessons (id) on delete cascade,
  attempt_number smallint not null check (attempt_number between 1 and 3),
  question_set   smallint not null check (question_set between 1 and 3),
  answers        jsonb not null,
  score          smallint not null,
  total          smallint not null,
  passed         boolean not null,
  created_at     timestamptz not null default now(),
  unique (user_id, lesson_id, attempt_number)
);

create index if not exists lessons_module_idx   on public.lessons (module_id, position);
create index if not exists materials_lesson_idx on public.lesson_materials (lesson_id, position);
create index if not exists attempts_user_idx    on public.quiz_attempts (user_id, lesson_id);
create index if not exists progress_user_idx    on public.watch_progress (user_id);

-- ---------------------------------------------------------------------------
-- Segurança (RLS)
-- Regra geral: o site acessa o banco pelo servidor, depois de conferir quem
-- está pedindo. Aqui deixamos tudo fechado por padrão e abrimos só a leitura
-- dos próprios dados (e a leitura de tudo para o gestor).
-- ---------------------------------------------------------------------------
create or replace function public.is_gestor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'gestor' and active
  );
$$;

alter table public.profiles         enable row level security;
alter table public.modules          enable row level security;
alter table public.lessons          enable row level security;
alter table public.questions        enable row level security;
alter table public.lesson_materials enable row level security;
alter table public.watch_progress   enable row level security;
alter table public.quiz_attempts    enable row level security;

drop policy if exists profiles_select  on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_gestor());

drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules
  for select to authenticated using (true);

-- lessons, questions e lesson_materials: sem policy = ninguém lê direto.
-- O servidor lê (com a chave secreta) e só entrega o que o aluno pode ver.

drop policy if exists progress_select on public.watch_progress;
create policy progress_select on public.watch_progress
  for select to authenticated
  using (user_id = auth.uid() or public.is_gestor());

drop policy if exists attempts_select on public.quiz_attempts;
create policy attempts_select on public.quiz_attempts
  for select to authenticated
  using (user_id = auth.uid() or public.is_gestor());

-- ---------------------------------------------------------------------------
-- Pasta privada para os PDFs de apoio
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materiais', 'materiais', false, 20971520, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 20971520,
      allowed_mime_types = array['application/pdf'];
