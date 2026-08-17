create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text,
  credits numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.player_inventories (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  inventory_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_states (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  position_z double precision not null default 0,
  velocity_x double precision not null default 0,
  velocity_y double precision not null default 0,
  velocity_z double precision not null default 0,
  rotation jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.world_chunks (
  chunk_key text primary key,
  block_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.ships (
  ship_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  voxel_matrix jsonb not null default '{}'::jsonb,
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  position_z double precision not null default 0,
  velocity_x double precision not null default 0,
  velocity_y double precision not null default 0,
  velocity_z double precision not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.factions (
  faction_id uuid primary key default gen_random_uuid(),
  name text not null unique,
  leader_id uuid not null references public.profiles(user_id) on delete cascade,
  friendly_fire boolean not null default false,
  door_passcode_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.faction_members (
  faction_id uuid references public.factions(faction_id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete cascade,
  can_build boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (faction_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.player_inventories enable row level security;
alter table public.player_states enable row level security;
alter table public.world_chunks enable row level security;
alter table public.ships enable row level security;
alter table public.factions enable row level security;
alter table public.faction_members enable row level security;
