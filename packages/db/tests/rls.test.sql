-- DuDu RLS verification. Runs in a single transaction and rolls back.
--   PGlite:  pnpm --filter @dudu/db test          (tests/rls.test.ts executes this file)
--   Postgres: psql "$DB_URL" -v ON_ERROR_STOP=1 -f packages/db/tests/rls.test.sql
-- Any failed expectation raises an exception whose message starts with "FAIL".

begin;

-- ── Fixtures (as postgres) ───────────────────────────────────────────────
insert into auth.users (id, email, phone, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-000000000001', 'parent.a@test.dudu', '+919000000001', '{"full_name":"Parent A"}'),
  ('b0000000-0000-4000-8000-000000000001', 'parent.b@test.dudu', '+919000000002', '{"full_name":"Parent B"}'),
  ('e0000000-0000-4000-8000-000000000001', 'owner@test.dudu', null, '{"full_name":"Owner"}'),
  ('e0000000-0000-4000-8000-000000000002', 'content@test.dudu', null, '{"full_name":"Content"}'),
  ('e0000000-0000-4000-8000-000000000003', 'support@test.dudu', null, '{"full_name":"Support"}'),
  ('e0000000-0000-4000-8000-000000000004', 'ops@test.dudu', null, '{"full_name":"Ops"}');

update public.profiles set role = 'owner' where user_id = 'e0000000-0000-4000-8000-000000000001';
update public.profiles set role = 'content' where user_id = 'e0000000-0000-4000-8000-000000000002';
update public.profiles set role = 'support' where user_id = 'e0000000-0000-4000-8000-000000000003';
update public.profiles set role = 'ops' where user_id = 'e0000000-0000-4000-8000-000000000004';

insert into public.families (id, name, owner_user_id) values
  ('fa000000-0000-4000-8000-00000000000a', 'Family A', 'a0000000-0000-4000-8000-000000000001'),
  ('fa000000-0000-4000-8000-00000000000b', 'Family B', 'b0000000-0000-4000-8000-000000000001');

insert into public.children (id, family_id, first_name, class) values
  ('c0000000-0000-4000-8000-00000000000a', 'fa000000-0000-4000-8000-00000000000a', 'Anu', 5),
  ('c0000000-0000-4000-8000-00000000000b', 'fa000000-0000-4000-8000-00000000000b', 'Bala', 3);

insert into public.devices (id, serial, model, family_id, child_id, status, device_secret_hash) values
  ('d0000000-0000-4000-8000-00000000000a', 'TEST-A', 'DB-01', 'fa000000-0000-4000-8000-00000000000a', 'c0000000-0000-4000-8000-00000000000a', 'online', 'hash-a'),
  ('d0000000-0000-4000-8000-00000000000b', 'TEST-B', 'DB-02', 'fa000000-0000-4000-8000-00000000000b', 'c0000000-0000-4000-8000-00000000000b', 'online', 'hash-b'),
  ('d0000000-0000-4000-8000-00000000000c', 'TEST-C', 'DB-03', null, null, 'provisioned', 'hash-c');

insert into public.pairing_codes (device_id, code6, qr_token, expires_at) values
  ('d0000000-0000-4000-8000-00000000000c', '424242', 'qr-test-token-c', now() + interval '10 minutes');

insert into public.reminders (child_id, title, time, repeat) values
  ('c0000000-0000-4000-8000-00000000000b', 'B: drink water', '16:00', 'daily');

insert into public.conversations (id, child_id, device_id, mode) values
  ('ca000000-0000-4000-8000-00000000000b', 'c0000000-0000-4000-8000-00000000000b', 'd0000000-0000-4000-8000-00000000000b', 'fun');

insert into public.turns (id, conversation_id, role, text) values
  ('ab000000-0000-4000-8000-000000000001', 'ca000000-0000-4000-8000-00000000000b', 'child', 'secret question one'),
  ('ab000000-0000-4000-8000-000000000002', 'ca000000-0000-4000-8000-00000000000b', 'dudu', 'answer one');

insert into public.prompts (key, version, body, status) values ('fun', 1, 'v1', 'live');

-- ── Parent A ─────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.families) <> 1 then raise exception 'FAIL parent A should see exactly 1 family'; end if;
  if exists (select 1 from public.families where name = 'Family B') then raise exception 'FAIL parent A can read family B'; end if;
  if exists (select 1 from public.children where first_name = 'Bala') then raise exception 'FAIL parent A can read child B'; end if;
  if exists (select 1 from public.devices where serial = 'TEST-B') then raise exception 'FAIL parent A can read device B'; end if;
  if exists (select 1 from public.reminders) then raise exception 'FAIL parent A can read reminders of B'; end if;
  if exists (select 1 from public.conversations) then raise exception 'FAIL parent A can read conversations of B'; end if;
  if exists (select 1 from public.turns) then raise exception 'FAIL parent A can read turns of B'; end if;
  if exists (select 1 from public.prompts) then raise exception 'FAIL parent can read prompts'; end if;
  if public.v_family_dashboard('c0000000-0000-4000-8000-00000000000b') is not null then
    raise exception 'FAIL v_family_dashboard leaks child B to parent A';
  end if;
  if public.v_family_dashboard('c0000000-0000-4000-8000-00000000000a') ->> 'child' is null then
    raise exception 'FAIL v_family_dashboard should return child A';
  end if;
end $$;

-- cannot write into family B
do $$
begin
  begin
    insert into public.reminders (child_id, title, time) values ('c0000000-0000-4000-8000-00000000000b', 'x', '10:00');
    raise exception 'FAIL parent A inserted a reminder for child B';
  exception when insufficient_privilege then null;
  end;
  update public.devices set volume_pct = 10 where serial = 'TEST-B';
  if found then raise exception 'FAIL parent A updated device B'; end if;
end $$;

-- device secret hash is never readable
do $$
begin
  begin
    perform device_secret_hash from public.devices;
    raise exception 'FAIL parent can read device_secret_hash';
  exception when insufficient_privilege then null;
  end;
end $$;

-- parents can change volume but not mode/status directly; mode goes through rpc_set_mode
do $$
begin
  update public.devices set volume_pct = 35 where serial = 'TEST-A';
  if not found then raise exception 'FAIL parent A cannot change own device volume'; end if;
  begin
    update public.devices set status = 'offline' where serial = 'TEST-A';
    raise exception 'FAIL parent A changed device status directly';
  exception when insufficient_privilege then null;
  end;
  if (public.rpc_set_mode('d0000000-0000-4000-8000-00000000000a', 'fun', now() + interval '1 hour') ->> 'mode') <> 'fun' then
    raise exception 'FAIL rpc_set_mode did not switch to fun';
  end if;
  begin
    perform public.rpc_set_mode('d0000000-0000-4000-8000-00000000000b', 'fun', null);
    raise exception 'FAIL parent A set mode on device B';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.rpc_request_snapshot('d0000000-0000-4000-8000-00000000000b');
    raise exception 'FAIL parent A requested a snapshot on device B';
  exception when insufficient_privilege then null;
  end;
  perform public.rpc_request_snapshot('d0000000-0000-4000-8000-00000000000a');
  if (select count(*) from public.snapshots) <> 1 then raise exception 'FAIL snapshot not visible to parent A'; end if;
end $$;

-- no privilege escalation, no billing edits
do $$
begin
  begin
    update public.profiles set role = 'owner' where user_id = auth.uid();
    raise exception 'FAIL parent escalated own role';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.families set plan = 'plus' where name = 'Family A';
    raise exception 'FAIL parent changed own plan';
  exception when insufficient_privilege then null;
  end;
  update public.families set whatsapp_opt_in = true where name = 'Family A';
  if not found then raise exception 'FAIL parent cannot toggle WhatsApp opt-in'; end if;
end $$;

-- pairing: by code, single use
do $$
declare
  d jsonb;
begin
  d := public.rpc_pair_device('424242');
  if d ->> 'family_id' <> 'fa000000-0000-4000-8000-00000000000a' then raise exception 'FAIL pairing assigned wrong family'; end if;
  if d ->> 'child_id' <> 'c0000000-0000-4000-8000-00000000000a' then raise exception 'FAIL pairing did not auto-assign only child'; end if;
  if d ->> 'status' <> 'paired' then raise exception 'FAIL pairing did not set status'; end if;
  if d ? 'device_secret_hash' then raise exception 'FAIL pairing leaked secret hash'; end if;
  begin
    perform public.rpc_pair_device('qr-test-token-c');
    raise exception 'FAIL pairing code reused';
  exception when no_data_found then null;
  end;
end $$;

reset role;

-- ── Parent B cannot see what A just paired ───────────────────────────────
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.devices where serial in ('TEST-A', 'TEST-C')) then raise exception 'FAIL parent B sees family A devices'; end if;
  if exists (select 1 from public.snapshots) then raise exception 'FAIL parent B sees family A snapshots'; end if;
  if (select count(*) from public.turns) <> 2 then raise exception 'FAIL parent B should read own conversation turns'; end if;
end $$;
reset role;

-- ── Anonymous ────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
begin
  begin
    perform 1 from public.families;
    raise exception 'FAIL anon can query families';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ── Support: no turn text without a safety review ────────────────────────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.turns) then raise exception 'FAIL support can read turns without a review'; end if;
  if (select count(*) from public.families) <> 2 then raise exception 'FAIL support should see all families'; end if;
  begin
    perform public.rpc_create_pairing_code('d0000000-0000-4000-8000-00000000000b');
    raise exception 'FAIL support created a pairing code';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

insert into public.safety_reviews (turn_id, category, severity)
values ('ab000000-0000-4000-8000-000000000001', 'personal-info request', 'medium');

set local role authenticated;
do $$
begin
  if (select count(*) from public.turns) <> 1 then raise exception 'FAIL support should read exactly the reviewed turn'; end if;
  if (select text from public.turns) <> 'secret question one' then raise exception 'FAIL support read the wrong turn'; end if;
end $$;
reset role;

-- ── Content: reads turns, cannot publish prompts or change model routes ──
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.turns) <> 2 then raise exception 'FAIL content should read all turns'; end if;
  insert into public.prompts (key, version, body) values ('fun', 2, 'draft v2');
  begin
    update public.prompts set status = 'draft' where key = 'fun' and version = 1;
    update public.prompts set status = 'live' where key = 'fun' and version = 2;
    raise exception 'FAIL content published a prompt';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.model_routes (task, provider, model) values ('tutor', 'x', 'y');
    raise exception 'FAIL content changed model routes';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ── Owner: publishes, edits routes; every admin mutation is audited ──────
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  before_count int := (select count(*) from public.audit_log);
begin
  update public.prompts set status = 'draft' where key = 'fun' and version = 1;
  update public.prompts set status = 'live' where key = 'fun' and version = 2;
  if (select published_by from public.prompts where key = 'fun' and version = 2) <> auth.uid() then
    raise exception 'FAIL publish did not stamp published_by';
  end if;
  begin
    update public.prompts set status = 'live' where key = 'fun' and version = 1;
    raise exception 'FAIL two live prompts for one key';
  exception when unique_violation then null;
  end;
  insert into public.model_routes (task, provider, model) values ('tutor', 'google', 'gemini-test');
  update public.families set plan = 'plus' where name = 'Family B';
  if (select count(*) from public.audit_log) < before_count + 4 then
    raise exception 'FAIL admin mutations were not audited';
  end if;
  if not exists (
    select 1 from public.audit_log
    where target_table = 'families' and action = 'update' and diff_json ? 'plan' and actor_id = auth.uid()
  ) then
    raise exception 'FAIL audit diff missing plan change';
  end if;
  if (public.v_admin_overview() -> 'kpis' ->> 'total_devices')::int <> 3 then
    raise exception 'FAIL v_admin_overview total_devices';
  end if;
end $$;
reset role;

-- ── Parent cannot call the admin overview ────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  begin
    perform public.v_admin_overview();
    raise exception 'FAIL parent called v_admin_overview';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select 'RLS OK' as result;
rollback;
