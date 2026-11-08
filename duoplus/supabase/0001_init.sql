-- DuoPlus: 2 kişilik eşleşme + belge senkronu
-- Supabase > SQL Editor'e yapıştırıp çalıştırın.
-- Önce: Authentication > Providers > "Allow anonymous sign-ins" AÇIK olmalı.

create table if not exists public.pairs (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.pair_members (
  pair_id uuid not null references public.pairs(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  primary key (pair_id, user_id),
  unique (user_id)
);

create table if not exists public.docs (
  pair_id uuid not null references public.pairs(id) on delete cascade,
  id text not null,
  kind text not null,
  owner_id uuid not null,
  data jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (pair_id, id)
);
create index if not exists docs_pair_updated on public.docs (pair_id, updated_at);

-- Sunucu saatiyle updated_at (saat kayması olmasın)
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before insert or update on public.docs
for each row execute function public.touch_updated_at();

-- Pair başına en fazla 2 üye
create or replace function public.limit_pair_members() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.pair_members where pair_id = new.pair_id) >= 2 then
    raise exception 'pair_full';
  end if;
  return new;
end $$;
drop trigger if exists pair_members_limit on public.pair_members;
create trigger pair_members_limit before insert on public.pair_members
for each row execute function public.limit_pair_members();

create or replace function public.is_pair_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pair_members where pair_id = p and user_id = auth.uid());
$$;

alter table public.pairs enable row level security;
alter table public.pair_members enable row level security;
alter table public.docs enable row level security;

create policy pairs_select on public.pairs for select using (public.is_pair_member(id));
create policy members_select on public.pair_members for select using (public.is_pair_member(pair_id));
create policy docs_select on public.docs for select using (public.is_pair_member(pair_id));
create policy docs_insert on public.docs for insert
  with check (public.is_pair_member(pair_id) and owner_id = auth.uid());
create policy docs_update on public.docs for update
  using (public.is_pair_member(pair_id) and owner_id = auth.uid())
  with check (public.is_pair_member(pair_id) and owner_id = auth.uid());
-- Not: bir kullanıcı partnerine ait "nudge/cheer" belgesi yazarken owner_id = kendisi olur.

-- 6 haneli kod, karışan karakterler yok
create or replace function public.gen_code() returns text
language plpgsql as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; out text := ''; i int;
begin
  for i in 1..6 loop out := out || substr(chars, 1 + floor(random()*length(chars))::int, 1); end loop;
  return out;
end $$;

create or replace function public.create_pair() returns table(pair_id uuid, code text)
language plpgsql security definer set search_path = public as $$
declare pid uuid; c text; existing uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select pm.pair_id into existing from pair_members pm where pm.user_id = auth.uid();
  if existing is not null then
    return query select p.id, p.code from pairs p where p.id = existing;
    return;
  end if;
  loop
    c := gen_code();
    exit when not exists (select 1 from pairs where pairs.code = c);
  end loop;
  insert into pairs(code, created_by) values (c, auth.uid()) returning id into pid;
  insert into pair_members(pair_id, user_id) values (pid, auth.uid());
  return query select pid, c;
end $$;

create or replace function public.join_pair(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid; existing uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select pm.pair_id into existing from pair_members pm where pm.user_id = auth.uid();
  select id into pid from pairs where pairs.code = upper(trim(p_code));
  if pid is null then raise exception 'invalid_code'; end if;
  if existing is not null then
    if existing = pid then return pid; end if;
    raise exception 'already_paired';
  end if;
  insert into pair_members(pair_id, user_id) values (pid, auth.uid());
  return pid;
end $$;

grant execute on function public.create_pair() to authenticated;
grant execute on function public.join_pair(text) to authenticated;

-- Realtime
alter publication supabase_realtime add table public.docs;
