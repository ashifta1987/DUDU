-- DuDu — Phase 1 · 004: dashboard views (as parameterised functions), RPCs and realtime

-- ── v_family_dashboard(child_id) ─────────────────────────────────────────
-- Security invoker: RLS decides whether the caller may see this child. Returns null otherwise.
create or replace function public.v_family_dashboard(p_child_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with
  c as (select * from public.children where id = p_child_id),
  today as (select public.today_ist() as d, extract(dow from public.today_ist())::int as dow),
  d as (
    select id, serial, model, status, battery_pct, wifi_rssi, volume_pct, mode, mode_until, last_seen_at,
           firmware, firmware_channel
    from public.devices
    where child_id = p_child_id
    order by last_seen_at desc nulls last
    limit 1
  ),
  todays_sessions as (
    select s.*
    from public.sessions s, today
    where s.child_id = p_child_id and (s.started_at at time zone 'Asia/Kolkata')::date = today.d
  )
  select jsonb_build_object(
    'child', to_jsonb(c),
    'device', (select to_jsonb(d) from d),
    'today', (select d from today),
    'weekday', (select dow from today),
    'schedule', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.start_time)
      from public.schedules s, today
      where s.child_id = p_child_id and s.weekday = today.dow
    ), '[]'::jsonb),
    'reminders', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.time)
      from public.reminders r, today
      where r.child_id = p_child_id and r.enabled and (
        r.repeat = 'daily'
        or (r.repeat = 'weekdays' and today.dow between 1 and 5)
        or (r.repeat = 'custom' and today.dow = any (r.days))
        or (r.repeat = 'once' and r.once_on = today.d)
      )
    ), '[]'::jsonb),
    'stats', (select to_jsonb(st) from public.child_stats st where st.child_id = p_child_id),
    'latest_homework', coalesce((
      select jsonb_agg(to_jsonb(h) order by h.created_at desc)
      from (
        select id, subject, title, result, score, created_at
        from public.homework_items
        where child_id = p_child_id
        order by created_at desc
        limit 3
      ) h
    ), '[]'::jsonb),
    'today_focus_minutes', coalesce((select sum(focus_minutes) from todays_sessions), 0),
    'today_presence', coalesce((
      select jsonb_agg(p order by p ->> 't')
      from todays_sessions ts, jsonb_array_elements(ts.presence_json) p
    ), '[]'::jsonb)
  )
  from c;
$$;

-- ── v_admin_overview(range) ──────────────────────────────────────────────
create or replace function public.v_admin_overview(p_from date default null, p_to date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_to date := coalesce(p_to, public.today_ist());
  v_from date := coalesce(p_from, coalesce(p_to, public.today_ist()) - 29);
  v_paired int;
  v_cost numeric;
begin
  if not public.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  if v_from > v_to then
    raise exception 'invalid range' using errcode = '22023';
  end if;

  select count(*) into v_paired from public.devices where family_id is not null;
  select coalesce(sum(cost_inr), 0) into v_cost from public.ai_usage_daily where date between v_from and v_to;

  return jsonb_build_object(
    'range', jsonb_build_object('from', v_from, 'to', v_to),
    'kpis', jsonb_build_object(
      'active_devices', (select count(*) from public.devices where last_seen_at >= now() - interval '24 hours'),
      'total_devices', (select count(*) from public.devices),
      'paired_devices', v_paired,
      'dau', (
        select coalesce(round(avg(n), 1), 0) from (
          select count(distinct child_id) as n
          from public.conversations
          where (started_at at time zone 'Asia/Kolkata')::date between v_from and v_to
          group by (started_at at time zone 'Asia/Kolkata')::date
        ) x
      ),
      'paid_subs', (
        select count(*) from public.subscriptions where status = 'active' and plan in ('basic', 'plus', 'school')
      ),
      'ai_cost_inr', v_cost,
      'ai_cost_per_device_inr', round(v_cost / greatest(v_paired, 1), 2)
    ),
    'conversations_per_day', (
      select coalesce(jsonb_agg(jsonb_build_object('date', g.d, 'study', coalesce(x.study, 0), 'fun', coalesce(x.fun, 0)) order by g.d), '[]'::jsonb)
      from generate_series(v_from, v_to, interval '1 day') as g (d)
      left join (
        select (started_at at time zone 'Asia/Kolkata')::date as d,
               count(*) filter (where mode = 'study') as study,
               count(*) filter (where mode = 'fun') as fun
        from public.conversations
        group by 1
      ) x on x.d = g.d::date
    ),
    'cost_by_service', (
      select coalesce(jsonb_agg(jsonb_build_object('service', service, 'cost_inr', cost) order by cost desc), '[]'::jsonb)
      from (
        select service, sum(cost_inr) as cost from public.ai_usage_daily
        where date between v_from and v_to group by service
      ) s
    ),
    'needs_attention', jsonb_build_object(
      'offline_devices', (
        select coalesce(jsonb_agg(jsonb_build_object('id', id, 'serial', serial, 'last_seen_at', last_seen_at) order by last_seen_at nulls first), '[]'::jsonb)
        from (
          select id, serial, last_seen_at from public.devices
          where family_id is not null and (last_seen_at is null or last_seen_at < now() - interval '24 hours')
          order by last_seen_at nulls first limit 10
        ) o
      ),
      'open_safety_reviews', (select count(*) from public.safety_reviews where status = 'open'),
      'open_high_severity', (select count(*) from public.safety_reviews where status = 'open' and severity = 'high'),
      'trials_ending_3d', (
        select count(*) from public.families
        where plan = 'trial' and trial_ends_at between now() and now() + interval '3 days'
      )
    ),
    'top_requests', (
      select coalesce(jsonb_agg(jsonb_build_object('topic', topic, 'count', n) order by n desc), '[]'::jsonb)
      from (
        select topic, count(*) as n from (
          select lower(subject) as topic, created_at from public.homework_items
          union all
          select lower(topic), taken_at from public.quizzes
        ) t
        where (created_at at time zone 'Asia/Kolkata')::date between v_from and v_to
        group by topic order by n desc limit 8
      ) tr
    )
  );
end;
$$;

-- ── rpc_create_pairing_code(device) — ops / service ──────────────────────
create or replace function public.rpc_create_pairing_code(p_device_id uuid, p_ttl_minutes int default 15)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_code text;
  v_row public.pairing_codes;
begin
  if not (public.is_service() or public.has_role('owner', 'ops')) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.devices where id = p_device_id) then
    raise exception 'device not found' using errcode = 'P0002';
  end if;
  -- retire previous unused codes for this device
  update public.pairing_codes set used_at = now() where device_id = p_device_id and used_at is null;
  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.pairing_codes where code6 = v_code and used_at is null);
  end loop;
  insert into public.pairing_codes (device_id, code6, expires_at)
  values (p_device_id, v_code, now() + make_interval(mins => greatest(p_ttl_minutes, 1)))
  returning * into v_row;
  return jsonb_build_object('code6', v_row.code6, 'qr_token', v_row.qr_token, 'expires_at', v_row.expires_at);
end;
$$;

-- ── rpc_pair_device(code_or_token) ───────────────────────────────────────
create or replace function public.rpc_pair_device(
  code_or_token text,
  p_child_id uuid default null,
  p_family_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code public.pairing_codes;
  v_device public.devices;
  v_family uuid;
  v_child uuid;
  v_input text := trim(coalesce(code_or_token, ''));
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_code from public.pairing_codes
  where used_at is null and expires_at > now() and (code6 = v_input or qr_token = v_input)
  order by created_at desc
  limit 1
  for update;
  if not found then
    raise exception 'invalid or expired pairing code' using errcode = 'P0002';
  end if;

  -- Resolve the family: explicit, else the caller's own (owner first), else create one.
  if p_family_id is not null then
    if not public.is_family_member(p_family_id) then
      raise exception 'not a member of that family' using errcode = '42501';
    end if;
    v_family := p_family_id;
  else
    select m.family_id into v_family from public.family_members m
    where m.user_id = v_uid order by (m.role = 'owner') desc, m.created_at limit 1;
    if v_family is null then
      insert into public.families (name, owner_user_id)
      values (coalesce((select nullif(full_name, '') from public.profiles where user_id = v_uid), 'My') || '''s family', v_uid)
      returning id into v_family;
    end if;
  end if;

  select * into v_device from public.devices where id = v_code.device_id for update;
  if v_device.family_id is not null and v_device.family_id <> v_family then
    raise exception 'device is paired to another family' using errcode = '42501';
  end if;

  if p_child_id is not null then
    if not exists (select 1 from public.children where id = p_child_id and family_id = v_family) then
      raise exception 'child does not belong to this family' using errcode = '42501';
    end if;
    v_child := p_child_id;
  elsif (select count(*) from public.children where family_id = v_family) = 1 then
    select id into v_child from public.children where family_id = v_family;
  end if;

  update public.devices
  set family_id = v_family,
      child_id = coalesce(v_child, child_id),
      status = case when status = 'provisioned' then 'paired'::public.device_status else status end
  where id = v_device.id
  returning * into v_device;

  update public.pairing_codes set used_at = now() where id = v_code.id;

  return to_jsonb(v_device) - 'device_secret_hash';
end;
$$;

-- ── rpc_set_mode(device, mode, until) ────────────────────────────────────
-- The gateway listens to devices changes over Realtime and forwards mode{…} to the device.
create or replace function public.rpc_set_mode(p_device_id uuid, p_mode public.dudu_mode, p_until timestamptz default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_device public.devices;
begin
  if not (public.can_access_device(p_device_id) or public.has_role('owner', 'ops') or public.is_service()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_until is not null and p_until <= now() then
    raise exception 'mode_until must be in the future' using errcode = '22023';
  end if;
  update public.devices set mode = p_mode, mode_until = p_until
  where id = p_device_id
  returning * into v_device;
  if not found then
    raise exception 'device not found' using errcode = 'P0002';
  end if;
  return jsonb_build_object('id', v_device.id, 'mode', v_device.mode, 'mode_until', v_device.mode_until, 'updated_at', v_device.updated_at);
end;
$$;

-- ── rpc_request_snapshot(device) ─────────────────────────────────────────
-- Creates a pending snapshot row; the gateway sends snapshot_request{}, the device announces it,
-- uploads to Storage and the gateway fills photo_path (parents see it via Realtime).
create or replace function public.rpc_request_snapshot(p_device_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.can_access_device(p_device_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.snapshots
    where device_id = p_device_id and created_at > now() - interval '30 seconds'
  ) then
    raise exception 'please wait a few seconds before taking another photo' using errcode = '54000';
  end if;
  insert into public.snapshots (device_id, requested_by, announced)
  values (p_device_id, auth.uid(), true)
  returning id into v_id;
  return v_id;
end;
$$;

-- ── Function privileges ──────────────────────────────────────────────────
revoke execute on function public.v_family_dashboard(uuid) from public, anon;
revoke execute on function public.v_admin_overview(date, date) from public, anon;
revoke execute on function public.rpc_create_pairing_code(uuid, int) from public, anon;
revoke execute on function public.rpc_pair_device(text, uuid, uuid) from public, anon;
revoke execute on function public.rpc_set_mode(uuid, public.dudu_mode, timestamptz) from public, anon;
revoke execute on function public.rpc_request_snapshot(uuid) from public, anon;
grant execute on function public.v_family_dashboard(uuid) to authenticated;
grant execute on function public.v_admin_overview(date, date) to authenticated;
grant execute on function public.rpc_create_pairing_code(uuid, int) to authenticated, service_role;
grant execute on function public.rpc_pair_device(text, uuid, uuid) to authenticated;
grant execute on function public.rpc_set_mode(uuid, public.dudu_mode, timestamptz) to authenticated, service_role;
grant execute on function public.rpc_request_snapshot(uuid) to authenticated;

-- ── Realtime ─────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.devices, public.snapshots;
  end if;
end;
$$;
