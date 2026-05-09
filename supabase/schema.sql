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

-- ─── Events ────────────────────────────────────────────────────────────────────
create table if not exists events (
  id                   text primary key default gen_random_uuid()::text,
  organizer_id         uuid references profiles(id),
  organizer_name       text not null,
  organizer_avatar     text default '🏁',
  organizer_badges     text[] default '{}',
  is_verified_org      boolean default false,
  category             text not null default 'community',
  title                text not null,
  description          text default '',
  cover_emoji          text default '🎫',
  event_date           timestamptz not null,
  end_date             timestamptz,
  location             text not null,
  location_url         text,
  ticket_type          text default 'free',
  ticket_price         int,
  ticket_url           text,
  whatsapp_number      text,
  interested_count     int default 0,
  attending_count      int default 0,
  max_capacity         int,
  is_non_refundable    boolean default false,
  tags                 text[] default '{}',
  created_at           timestamptz default now()
);

create table if not exists event_interactions (
  id         text primary key default gen_random_uuid()::text,
  event_id   text references events(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  type       text not null,
  created_at timestamptz default now(),
  unique(event_id, user_id, type)
);

-- ─── Shop Products ──────────────────────────────────────────────────────────────
create table if not exists products (
  id                   text primary key default gen_random_uuid()::text,
  seller_id            uuid references profiles(id),
  seller_name          text not null,
  seller_avatar        text default '🛒',
  seller_badges        text[] default '{}',
  is_official_store    boolean default false,
  category             text not null,
  name                 text not null,
  description          text default '',
  image_emoji          text,
  price_idr            int not null,
  original_price_idr   int,
  rating               numeric(3,2) default 0,
  review_count         int default 0,
  sold_count           int default 0,
  buy_url              text,
  whatsapp_number      text,
  in_stock             boolean default true,
  tags                 text[] default '{}',
  is_new               boolean default false,
  is_featured          boolean default false,
  created_at           timestamptz default now()
);

-- RLS
alter table events enable row level security;
alter table event_interactions enable row level security;
alter table products enable row level security;

create policy "Anyone reads events"  on events for select using (true);
create policy "Org inserts events"   on events for insert with check (auth.uid() = organizer_id);
create policy "Org updates events"   on events for update using (auth.uid() = organizer_id);
create policy "Org deletes events"   on events for delete using (auth.uid() = organizer_id);

create policy "Anyone reads products"   on products for select using (true);
create policy "Seller inserts products" on products for insert with check (auth.uid() = seller_id);
create policy "Seller updates products" on products for update using (auth.uid() = seller_id);
create policy "Seller deletes products" on products for delete using (auth.uid() = seller_id);

create policy "Users read own interactions"   on event_interactions for select using (auth.uid() = user_id);
create policy "Users insert interactions"     on event_interactions for insert with check (auth.uid() = user_id);
create policy "Users delete interactions"     on event_interactions for delete using (auth.uid() = user_id);

-- Trigger: auto-increment counts when interactions are inserted/deleted
create or replace function update_event_counts() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.type = 'interested' then
      update events set interested_count = interested_count + 1 where id = NEW.event_id;
    elsif NEW.type = 'attending' then
      update events set attending_count = attending_count + 1 where id = NEW.event_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.type = 'interested' then
      update events set interested_count = greatest(0, interested_count - 1) where id = OLD.event_id;
    elsif OLD.type = 'attending' then
      update events set attending_count = greatest(0, attending_count - 1) where id = OLD.event_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_event_interaction_change
  after insert or delete on event_interactions
  for each row execute function update_event_counts();

-- ─── Instagram Integration ────────────────────────────────────────────────────

-- Brand/community Instagram accounts connected via OAuth
create table if not exists instagram_accounts (
  id                  uuid primary key default gen_random_uuid(),
  ig_user_id          text unique not null,
  username            text not null,
  display_name        text,
  bio                 text,
  profile_picture_url text,
  follower_count      integer default 0,
  badge               text,
  access_token        text not null,
  token_expires_at    timestamptz,
  connected_by        uuid references auth.users(id),
  is_active           boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Cached Instagram posts (fetched by the Edge Function cron)
create table if not exists instagram_posts (
  id             uuid primary key default gen_random_uuid(),
  ig_media_id    text unique not null,
  account_id     uuid references instagram_accounts(id) on delete cascade,
  ig_user_id     text not null,
  username       text not null,
  caption        text,
  media_type     text check (media_type in ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM')),
  media_url      text,
  thumbnail_url  text,
  permalink      text,
  like_count     integer,
  comment_count  integer,
  posted_at      timestamptz,
  fetched_at     timestamptz default now(),
  created_at     timestamptz default now()
);

create index if not exists instagram_posts_account_idx   on instagram_posts(account_id);
create index if not exists instagram_posts_posted_at_idx on instagram_posts(posted_at desc);

alter table instagram_accounts enable row level security;
alter table instagram_posts     enable row level security;

create policy "Public reads active accounts" on instagram_accounts
  for select using (is_active = true);

create policy "Public reads posts" on instagram_posts
  for select using (true);

create policy "Service manages accounts" on instagram_accounts
  for all using (auth.role() = 'service_role');

create policy "Service manages posts" on instagram_posts
  for all using (auth.role() = 'service_role');
