-- Enable required extension for UUID generation.
create extension if not exists pgcrypto;

create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  meta jsonb not null default '{}'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  vendors jsonb not null default '[]'::jsonb,
  guests jsonb not null default '[]'::jsonb,
  tables jsonb not null default '[]'::jsonb,
  budget jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wedding_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid,
  invited_email text not null,
  role text not null check (role in ('owner', 'editor')),
  status text not null check (status in ('pending', 'active')),
  invited_by_user_id uuid not null,
  created_at timestamptz not null default now()
);

create unique index if not exists wedding_members_wedding_email_unique
  on public.wedding_members (wedding_id, invited_email);

create unique index if not exists wedding_members_wedding_user_unique
  on public.wedding_members (wedding_id, user_id)
  where user_id is not null;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists weddings_set_updated_at on public.weddings;
create trigger weddings_set_updated_at
before update on public.weddings
for each row execute function public.set_updated_at();

alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;

-- Helper functions to avoid recursive policy checks on wedding_members.
create or replace function public.is_wedding_active_member(_wedding_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.wedding_members wm
    where wm.wedding_id = _wedding_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  );
$$;

create or replace function public.is_wedding_owner(_wedding_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.wedding_members wm
    where wm.wedding_id = _wedding_id
      and wm.user_id = auth.uid()
      and wm.role = 'owner'
      and wm.status = 'active'
  );
$$;

drop policy if exists weddings_select_active_members on public.weddings;
create policy weddings_select_active_members on public.weddings
for select
using (
  owner_user_id = auth.uid()
  or public.is_wedding_active_member(weddings.id)
);

drop policy if exists weddings_insert_owner on public.weddings;
create policy weddings_insert_owner on public.weddings
for insert
with check (owner_user_id = auth.uid());

drop policy if exists weddings_update_active_members on public.weddings;
create policy weddings_update_active_members on public.weddings
for update
using (
  public.is_wedding_active_member(weddings.id)
)
with check (
  public.is_wedding_active_member(weddings.id)
);

drop policy if exists wedding_members_select_visible on public.wedding_members;
create policy wedding_members_select_visible on public.wedding_members
for select
using (
  -- Active members can view the whole collaborator list for their workspace.
  public.is_wedding_active_member(wedding_members.wedding_id)
  or (
    -- Pending invitees can read their own invite rows by email.
    lower(wedding_members.invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  )
);

drop policy if exists wedding_members_insert_owner_or_owner_invites on public.wedding_members;
create policy wedding_members_insert_owner_or_owner_invites on public.wedding_members
for insert
with check (
  (
    role = 'owner'
    and status = 'active'
    and user_id = auth.uid()
    and invited_by_user_id = auth.uid()
    and exists (
      select 1
      from public.weddings w
      where w.id = wedding_id
        and w.owner_user_id = auth.uid()
    )
  )
  or (
    role = 'editor'
    and status = 'pending'
    and user_id is null
    and public.is_wedding_owner(wedding_members.wedding_id)
  )
);

drop policy if exists wedding_members_update_accept_own_pending on public.wedding_members;
create policy wedding_members_update_accept_own_pending on public.wedding_members
for update
using (
  (
    lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
    and status = 'pending'
    and user_id is null
  )
  or public.is_wedding_owner(wedding_members.wedding_id)
)
with check (
  (
    lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
    and status = 'active'
    and user_id = auth.uid()
  )
  or public.is_wedding_owner(wedding_members.wedding_id)
);

drop policy if exists wedding_members_delete_owner_only on public.wedding_members;
create policy wedding_members_delete_owner_only on public.wedding_members
for delete
using (
  public.is_wedding_owner(wedding_members.wedding_id)
  and wedding_members.role <> 'owner'
);
