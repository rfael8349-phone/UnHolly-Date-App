-- Esquema inicial de UnHolly. Revisar y probar en un proyecto Supabase nuevo antes de producción.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  birth_date date,
  bio text check (char_length(coalesce(bio, '')) <= 500),
  city text,
  avatar_path text,
  discoverable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_one uuid not null references public.profiles(id) on delete cascade,
  user_two uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_one <> user_two),
  unique(user_one, user_two)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- El propietario puede leer y editar su propio perfil.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Un usuario solo puede consultar y crear likes que él mismo envía o recibe.
create policy "likes_select_participant" on public.likes
  for select to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "likes_insert_sender" on public.likes
  for insert to authenticated with check (auth.uid() = sender_id);
create policy "likes_delete_sender" on public.likes
  for delete to authenticated using (auth.uid() = sender_id);

-- Solo los participantes de una conversación pueden ver sus miembros y mensajes.
create policy "members_select_self" on public.conversation_members
  for select to authenticated using (auth.uid() = user_id);
create policy "conversations_select_member" on public.conversations
  for select to authenticated using (
    exists (select 1 from public.conversation_members m where m.conversation_id = id and m.user_id = auth.uid())
  );
create policy "messages_select_member" on public.messages
  for select to authenticated using (
    exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
  );
create policy "messages_insert_member" on public.messages
  for insert to authenticated with check (
    auth.uid() = sender_id and
    exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
  );

-- Nota: matches y la gestión de miembros requieren funciones/operaciones de servidor
-- y políticas adicionales antes de habilitarse en producción.
