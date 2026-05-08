-- ============================================================
-- MotoTrack — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─── Profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text not null,
  avatar      text default '🤙',
  created_at  timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '🤙')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Riders (live location) ───────────────────────────────────
create table if not exists riders (
  id          text primary key,          -- e.g. 'rider-1'
  user_id     uuid references profiles(id) on delete cascade,
  name        text not null,
  avatar      text default '🤙',
  color       text default '#ff6b35',
  lat         double precision default -8.6705,
  lng         double precision default 115.2126,
  heading     int default 0,
  speed       int default 0,
  status      text default 'offline',    -- riding | stopped | offline
  bike_id     text,
  updated_at  timestamptz default now()
);

-- ─── Groups ───────────────────────────────────────────────────
create table if not exists groups (
  id               text primary key default gen_random_uuid()::text,
  name             text not null,
  emoji            text default '🏍️',
  description      text default '',
  owner_id         uuid references profiles(id),
  destination_lat  double precision,
  destination_lng  double precision,
  destination_name text,
  is_active        boolean default true,
  created_at       timestamptz default now()
);

create table if not exists group_members (
  group_id  text references groups(id) on delete cascade,
  user_id   uuid references profiles(id) on delete cascade,
  rider_id  text,
  primary key (group_id, user_id)
);

-- ─── Bikes ────────────────────────────────────────────────────
create table if not exists bikes (
  id                 text primary key default gen_random_uuid()::text,
  user_id            uuid references profiles(id) on delete cascade,
  nickname           text,
  brand              text not null,
  model              text not null,
  year               int,
  type               text,
  cc                 int,
  color              text,
  plate_number       text,
  odometer           int default 0,
  is_favorite        boolean default false,
  photo              text,
  image_url          text,
  notes              text,
  oil_brand          text,
  oil_type           text,
  oil_sae            text,
  tire_front_brand   text,
  tire_front_health  int,
  tire_rear_brand    text,
  tire_rear_health   int,
  drive_type         text,
  drive_brand        text,
  drive_health       int,
  created_at         timestamptz default now()
);

-- ─── Maintenance ──────────────────────────────────────────────
create table if not exists maintenance_records (
  id                text primary key default gen_random_uuid()::text,
  bike_id           text references bikes(id) on delete cascade,
  type              text not null,
  date              timestamptz not null,
  odometer          int,
  notes             text default '',
  next_service_km   int,
  next_service_date timestamptz,
  cost              int,
  created_at        timestamptz default now()
);

-- ─── Conversations ────────────────────────────────────────────
create table if not exists conversations (
  id          text primary key default gen_random_uuid()::text,
  type        text not null,   -- 'group' | 'dm'
  name        text not null,
  emoji       text,
  group_id    text references groups(id) on delete set null,
  is_pinned   boolean default false,
  created_at  timestamptz default now()
);

create table if not exists conversation_participants (
  conversation_id  text references conversations(id) on delete cascade,
  user_id          uuid references profiles(id) on delete cascade,
  unread_count     int default 0,
  last_read_at     timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- ─── Messages ────────────────────────────────────────────────
create table if not exists messages (
  id               text primary key default gen_random_uuid()::text,
  conversation_id  text references conversations(id) on delete cascade,
  sender_id        uuid references profiles(id),
  sender_name      text not null,
  sender_avatar    text default '🤙',
  content          text default '',
  type             text default 'text',  -- text | location | ride_invite | system | now_playing
  ride_data        jsonb,
  location_data    jsonb,
  music_data       jsonb,
  created_at       timestamptz default now()
);

create table if not exists message_reactions (
  message_id  text references messages(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  emoji       text not null,
  primary key (message_id, user_id, emoji)
);

-- ─── Ride History ─────────────────────────────────────────────
create table if not exists ride_history (
  id           text primary key default gen_random_uuid()::text,
  user_id      uuid references profiles(id) on delete cascade,
  title        text,
  distance_km  double precision,
  duration_s   int,
  avg_speed    int,
  top_speed    int,
  route        jsonb,   -- array of {lat, lng}
  buddies      jsonb,   -- array of rider names
  weather      text,
  is_public    boolean default true,
  started_at   timestamptz,
  ended_at     timestamptz,
  created_at   timestamptz default now()
);

-- ─── Enable Real-time ────────────────────────────────────────
-- Run these in the Supabase Dashboard → Database → Replication
-- Or uncomment and run here:
-- alter publication supabase_realtime add table riders;
-- alter publication supabase_realtime add table messages;
-- alter publication supabase_realtime add table message_reactions;

-- ─── Row Level Security ───────────────────────────────────────
alter table profiles enable row level security;
alter table riders enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table bikes enable row level security;
alter table maintenance_records enable row level security;
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table message_reactions enable row level security;
alter table ride_history enable row level security;

-- Profiles
create policy "Public profiles readable" on profiles for select using (true);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- Riders — everyone can see all riders (needed for map)
create policy "Anyone reads riders" on riders for select using (true);
create policy "Users upsert own rider" on riders for insert with check (auth.uid() = user_id);
create policy "Users update own rider" on riders for update using (auth.uid() = user_id);

-- Groups
create policy "Anyone reads groups" on groups for select using (true);
create policy "Users create groups" on groups for insert with check (auth.uid() = owner_id);
create policy "Owner updates group" on groups for update using (auth.uid() = owner_id);
create policy "Owner deletes group" on groups for delete using (auth.uid() = owner_id);

-- Group members
create policy "Anyone reads members" on group_members for select using (true);
create policy "Users join groups" on group_members for insert with check (auth.uid() = user_id);
create policy "Users leave groups" on group_members for delete using (auth.uid() = user_id);

-- Bikes
create policy "Users read own bikes" on bikes for select using (auth.uid() = user_id);
create policy "Users insert bikes" on bikes for insert with check (auth.uid() = user_id);
create policy "Users update bikes" on bikes for update using (auth.uid() = user_id);
create policy "Users delete bikes" on bikes for delete using (auth.uid() = user_id);

-- Maintenance
create policy "Users read own maintenance" on maintenance_records for select
  using (exists (select 1 from bikes where id = bike_id and user_id = auth.uid()));
create policy "Users insert maintenance" on maintenance_records for insert
  with check (exists (select 1 from bikes where id = bike_id and user_id = auth.uid()));

-- Conversations
create policy "Participants read conversations" on conversations for select
  using (exists (select 1 from conversation_participants where conversation_id = id and user_id = auth.uid()));
create policy "Users create conversations" on conversations for insert with check (true);

-- Conversation participants
create policy "Participants read participants" on conversation_participants for select
  using (exists (select 1 from conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid()));
create policy "Users join conversations" on conversation_participants for insert with check (auth.uid() = user_id);
create policy "Users update own participation" on conversation_participants for update using (auth.uid() = user_id);

-- Messages
create policy "Participants read messages" on messages for select
  using (exists (select 1 from conversation_participants where conversation_id = messages.conversation_id and user_id = auth.uid()));
create policy "Participants send messages" on messages for insert
  with check (auth.uid() = sender_id and exists (
    select 1 from conversation_participants where conversation_id = messages.conversation_id and user_id = auth.uid()
  ));

-- Reactions
create policy "Participants read reactions" on message_reactions for select
  using (exists (
    select 1 from messages m
    join conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_id and cp.user_id = auth.uid()
  ));
create policy "Users manage own reactions" on message_reactions for all using (auth.uid() = user_id);

-- Ride history
create policy "Users read own rides" on ride_history for select using (auth.uid() = user_id or is_public = true);
create policy "Users insert rides" on ride_history for insert with check (auth.uid() = user_id);
create policy "Users update own rides" on ride_history for update using (auth.uid() = user_id);
