-- Preferencias públicas voluntarias de perfil para UnHolly.
-- Ejecutar una sola vez en Supabase SQL Editor.
create table if not exists public.profile_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  interests text[] not null default '{}',
  intentions text[] not null default '{}',
  dating_style text not null default 'Conocer sin presión',
  show_interests boolean not null default true,
  show_intentions boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.profile_preferences enable row level security;

drop policy if exists "profile_preferences_owner_select" on public.profile_preferences;
create policy "profile_preferences_owner_select"
  on public.profile_preferences for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "profile_preferences_owner_insert" on public.profile_preferences;
create policy "profile_preferences_owner_insert"
  on public.profile_preferences for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "profile_preferences_owner_update" on public.profile_preferences;
create policy "profile_preferences_owner_update"
  on public.profile_preferences for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Devuelve únicamente intereses/intenciones que el titular ha decidido mostrar.
-- La ubicación, fecha de nacimiento, correo y preferencias de búsqueda nunca se exponen.
create or replace function public.get_discoverable_profile_preferences()
returns table (
  user_id uuid,
  display_name text,
  interests text[],
  intentions text[],
  dating_style text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    case when coalesce(pp.show_interests, false) then coalesce(pp.interests, '{}') else '{}'::text[] end,
    case when coalesce(pp.show_intentions, false) then coalesce(pp.intentions, '{}') else '{}'::text[] end,
    case when coalesce(pp.show_intentions, false) then pp.dating_style else null end
  from public.profiles p
  left join public.profile_preferences pp on pp.user_id = p.id
  where p.discoverable = true
    and p.id <> auth.uid()
    and auth.uid() is not null;
$$;

revoke all on function public.get_discoverable_profile_preferences() from public;
grant execute on function public.get_discoverable_profile_preferences() to authenticated;
