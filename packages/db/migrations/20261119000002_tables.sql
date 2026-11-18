-- DuDu — Phase 1 · 002: tables
-- Every table: id uuid pk, created_at, updated_at. RLS is enabled for all tables in 003.

-- ── People & families ────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'parent',
  locale public.locale not null default 'en',
  city text
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  owner_user_id uuid not null references auth.users (id) on delete restrict,
  plan public.plan not null default 'trial',
  plan_renews_at timestamptz,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  whatsapp_opt_in boolean not null default false,
  purge_scheduled_at timestamptz
);
create index families_owner_idx on public.families (owner_user_id);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.family_member_role not null default 'guardian',
  unique (family_id, user_id)
);
create index family_members_user_idx on public.family_members (user_id);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  family_id uuid not null references public.families (id) on delete cascade,
  first_name text not null,
  class int not null check (class between 1 and 10),
  board public.board not null default 'cbse',
  languages text[] not null default array['en'],
  avatar_color text not null default '#F26B1D',
  fun_daily_limit_min int not null default 45 check (fun_daily_limit_min between 0 and 600),
  quiet_hours_start time,
  quiet_hours_end time
);
create index children_family_idx on public.children (family_id);

-- ── Devices ──────────────────────────────────────────────────────────────
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  serial text not null unique,
  model public.device_model not null,
  family_id uuid references public.families (id) on delete set null,
  child_id uuid references public.children (id) on delete set null,
  firmware text,
  firmware_channel public.firmware_channel not null default 'stable',
  status public.device_status not null default 'provisioned',
  last_seen_at timestamptz,
  battery_pct int check (battery_pct between 0 and 100),
  wifi_rssi int,
  volume_pct int not null default 60 check (volume_pct between 0 and 100),
  mode public.dudu_mode not null default 'study',
  mode_until timestamptz,
  device_secret_hash text
);
create index devices_family_idx on public.devices (family_id);
create index devices_child_idx on public.devices (child_id);

create table public.pairing_codes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  device_id uuid not null references public.devices (id) on delete cascade,
  code6 text not null check (code6 ~ '^[0-9]{6}$'),
  qr_token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  used_at timestamptz
);
create index pairing_codes_device_idx on public.pairing_codes (device_id);
create unique index pairing_codes_active_code_idx on public.pairing_codes (code6) where used_at is null;

-- ── Routine ──────────────────────────────────────────────────────────────
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  child_id uuid not null references public.children (id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  subject text not null,
  mode public.dudu_mode not null default 'study',
  check (end_time > start_time)
);
create index schedules_child_day_idx on public.schedules (child_id, weekday);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  child_id uuid not null references public.children (id) on delete cascade,
  title text not null,
  time time not null,
  repeat public.reminder_repeat not null default 'daily',
  days int[] not null default '{}',
  once_on date,
  enabled boolean not null default true,
  last_fired_at timestamptz,
  check (days <@ array[0, 1, 2, 3, 4, 5, 6])
);
create index reminders_child_idx on public.reminders (child_id);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  device_id uuid not null references public.devices (id) on delete cascade,
  child_id uuid references public.children (id) on delete cascade,
  mode public.dudu_mode not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  -- [{ "t": "2026-11-19T16:00:00+05:30", "at_desk": true }, …] one bucket per minute
  presence_json jsonb not null default '[]'::jsonb,
  focus_minutes int not null default 0
);
create index sessions_child_started_idx on public.sessions (child_id, started_at desc);

-- ── Conversations ────────────────────────────────────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  child_id uuid references public.children (id) on delete cascade,
  device_id uuid references public.devices (id) on delete set null,
  mode public.dudu_mode not null,
  started_at timestamptz not null default now()
);
create index conversations_child_started_idx on public.conversations (child_id, started_at desc);
create index conversations_started_idx on public.conversations (started_at);

create table public.turns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role public.turn_role not null,
  text text not null,
  audio_path text,
  lang text not null default 'en',
  face_state text,
  latency_ms int,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  cost_inr numeric(12, 4) not null default 0,
  safety_flag public.safety_flag not null default 'none'
);
create index turns_conversation_idx on public.turns (conversation_id, created_at);

-- ── Learning ─────────────────────────────────────────────────────────────
create table public.homework_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  child_id uuid not null references public.children (id) on delete cascade,
  subject text not null,
  title text not null,
  photo_paths text[] not null default '{}',
  explanation_text text,
  explanation_audio_path text,
  result public.homework_result,
  score text
);
create index homework_child_created_idx on public.homework_items (child_id, created_at desc);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  child_id uuid not null references public.children (id) on delete cascade,
  topic text not null,
  questions_json jsonb not null default '[]'::jsonb,
  score int not null default 0,
  max_score int not null default 0,
  stars_earned int not null default 0,
  taken_at timestamptz not null default now(),
  check (score >= 0 and score <= max_score)
);
create index quizzes_child_taken_idx on public.quizzes (child_id, taken_at desc);

create table public.child_stats (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  child_id uuid not null unique references public.children (id) on delete cascade,
  stars int not null default 0,
  streak_days int not null default 0,
  badges text[] not null default '{}',
  last_active_date date
);

create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  device_id uuid not null references public.devices (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  photo_path text, -- filled by the gateway once the device uploads
  announced boolean not null default true,
  expires_at timestamptz not null default (now() + interval '7 days')
);
create index snapshots_device_created_idx on public.snapshots (device_id, created_at desc);
create index snapshots_expires_idx on public.snapshots (expires_at);

-- ── Content & AI configuration ───────────────────────────────────────────
create table public.content_packs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  board public.board not null,
  class int not null check (class between 1 and 10),
  subjects text[] not null default '{}',
  -- [{ "id", "subject", "title", "topics": [], "quiz_bank": [{ "id", "q", "options": [4], "answer": idx, "explanation" }] }]
  chapters_json jsonb not null default '[]'::jsonb,
  quiz_bank_count int not null default 0,
  status public.content_status not null default 'draft'
);
create unique index content_packs_live_idx on public.content_packs (board, class) where status = 'live';

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  key public.prompt_key not null,
  version int not null check (version > 0),
  body text not null,
  status public.prompt_status not null default 'draft',
  eval_score numeric(5, 2),
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  unique (key, version)
);
-- Only one live prompt per key.
create unique index prompts_one_live_per_key on public.prompts (key) where status = 'live';

create table public.model_routes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  task public.model_task not null,
  provider text not null,
  model text not null,
  lang text,
  is_active boolean not null default true,
  -- lower runs first; higher priorities are fallbacks
  priority int not null default 1,
  -- provider options, e.g. { "voice": "kavya", "pace": 0.95 }
  config_json jsonb not null default '{}'::jsonb
);
create index model_routes_task_idx on public.model_routes (task, lang, priority) where is_active;

create table public.media_library (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  type public.media_type not null,
  title text not null,
  lang text not null default 'en',
  duration_s int,
  storage_path text,
  stream_url text,
  age_min int not null default 4,
  age_max int not null default 14,
  status public.media_status not null default 'pending',
  generated_by_ai boolean not null default false,
  -- set when a parent asks for an AI story; that family can see it while pending
  requested_by_family_id uuid references public.families (id) on delete cascade,
  body_text text,
  check (age_min <= age_max)
);
create index media_status_idx on public.media_library (status, type);

-- ── Commerce ─────────────────────────────────────────────────────────────
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  family_id uuid not null references public.families (id) on delete cascade,
  plan public.plan not null,
  status public.subscription_status not null default 'created',
  provider public.subscription_provider not null default 'razorpay',
  provider_sub_id text unique,
  amount_inr numeric(10, 2) not null,
  current_period_end timestamptz
);
create index subscriptions_family_idx on public.subscriptions (family_id);

create table public.preorders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  phone text not null check (phone ~ '^\+?[0-9]{10,13}$'),
  email text,
  model public.device_model not null,
  city text not null,
  deposit_paid boolean not null default false,
  razorpay_order_id text unique
);

-- ── Operations ───────────────────────────────────────────────────────────
create table public.ai_usage_daily (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  date date not null,
  service public.ai_service not null,
  provider text not null,
  units numeric(14, 2) not null default 0,
  cost_inr numeric(12, 2) not null default 0,
  device_count int not null default 0,
  unique (date, service, provider)
);

create table public.safety_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  turn_id uuid not null references public.turns (id) on delete cascade,
  category text not null,
  severity public.severity not null default 'low',
  status public.review_status not null default 'open',
  decision public.review_decision,
  reviewer_id uuid references auth.users (id) on delete set null,
  second_reviewer_id uuid references auth.users (id) on delete set null,
  note text
);
create index safety_reviews_turn_idx on public.safety_reviews (turn_id);
create index safety_reviews_status_idx on public.safety_reviews (status, created_at desc);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  diff_json jsonb not null default '{}'::jsonb
);
create index audit_log_target_idx on public.audit_log (target_table, target_id);
create index audit_log_created_idx on public.audit_log (created_at desc);

create table public.firmware_releases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null,
  channel public.firmware_channel not null default 'stable',
  storage_path text not null,
  notes text,
  rollout_pct int not null default 0 check (rollout_pct between 0 and 100),
  unique (version, channel)
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  key text not null unique,
  value_json jsonb not null default '{}'::jsonb
);

-- ── updated_at triggers for every table ──────────────────────────────────
do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;
