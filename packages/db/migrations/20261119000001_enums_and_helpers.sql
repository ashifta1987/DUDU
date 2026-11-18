-- DuDu — Phase 1 · 001: enums and shared helpers
-- Weekday convention everywhere: 0 = Sunday … 6 = Saturday (matches JS Date#getDay and extract(dow)).
-- Business timezone: Asia/Kolkata.

-- ── Enums ────────────────────────────────────────────────────────────────
create type public.user_role as enum ('parent', 'owner', 'ops', 'content', 'support');
create type public.locale as enum ('en', 'ml', 'hi');
create type public.plan as enum ('trial', 'basic', 'plus', 'school');
create type public.family_member_role as enum ('owner', 'guardian');
create type public.board as enum ('cbse', 'scert', 'icse');
create type public.device_model as enum ('DB-01', 'DB-02', 'DB-03', 'DB-04');
create type public.firmware_channel as enum ('stable', 'rc');
create type public.device_status as enum ('provisioned', 'paired', 'online', 'sleeping', 'offline');
create type public.dudu_mode as enum ('study', 'fun');
create type public.reminder_repeat as enum ('once', 'daily', 'weekdays', 'custom');
create type public.turn_role as enum ('child', 'dudu');
create type public.safety_flag as enum ('none', 'softened', 'blocked', 'review');
create type public.homework_result as enum ('correct', 'retry', 'partial', 'explained');
create type public.content_status as enum ('draft', 'review', 'live');
create type public.prompt_key as enum ('tutor_study', 'fun', 'story', 'quiz', 'safety');
create type public.prompt_status as enum ('draft', 'live');
create type public.model_task as enum ('tutor', 'fun', 'vision', 'stt', 'tts');
create type public.media_type as enum ('story', 'rhyme', 'ambience', 'radio');
create type public.media_status as enum ('pending', 'approved', 'rejected');
create type public.subscription_provider as enum ('razorpay');
create type public.subscription_status as enum ('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired');
create type public.ai_service as enum ('stt', 'llm_tutor', 'llm_fun', 'tts', 'vision');
create type public.severity as enum ('low', 'medium', 'high');
create type public.review_status as enum ('open', 'reviewed');
create type public.review_decision as enum ('reply_ok', 'too_strict', 'should_block', 'notify_parent');

-- ── updated_at trigger ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- AUTHORIZATION check: true only for the service role JWT (gateway, server routes, cron) or a direct
-- database session with no JWT at all (migrations, SQL editor, seed over psql).
-- Safe inside SECURITY DEFINER functions because it never trusts current_user alone.
create or replace function public.is_service()
returns boolean
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role'
      or (
        coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}') in ('{}', 'null')
        and session_user in ('postgres', 'supabase_admin')
      );
$$;

-- GUARD check: true when running as a privileged role — the service role, a direct superuser session,
-- or inside a SECURITY DEFINER function (which has already done its own authorization).
-- Use only in column/row guard triggers, never to decide who may call an RPC.
create or replace function public.is_trusted()
returns boolean
language sql
stable
as $$
  select public.is_service() or current_user in ('postgres', 'supabase_admin', 'service_role');
$$;

-- Today's date in India.
create or replace function public.today_ist()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;
