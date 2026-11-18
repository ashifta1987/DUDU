-- DuDu — Phase 1 · 003: auth helpers, guards, audit and row-level security

-- ── Identity helpers (security definer → no RLS recursion) ───────────────
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid();
$$;

create or replace function public.has_role(variadic roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = any (roles));
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('owner', 'ops', 'content', 'support');
$$;

create or replace function public.is_family_member(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.family_members where family_id = fid and user_id = auth.uid());
$$;

create or replace function public.is_family_owner(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.families where id = fid and owner_user_id = auth.uid())
      or exists (select 1 from public.family_members where family_id = fid and user_id = auth.uid() and role = 'owner');
$$;

create or replace function public.can_access_child(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.children c
    join public.family_members m on m.family_id = c.family_id
    where c.id = cid and m.user_id = auth.uid()
  );
$$;

create or replace function public.can_access_device(did uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.devices d
    join public.family_members m on m.family_id = d.family_id
    where d.id = did and m.user_id = auth.uid()
  );
$$;

create or replace function public.can_access_conversation(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = cid
      and (public.can_access_child(c.child_id) or public.can_access_device(c.device_id))
  );
$$;

-- ── New auth user → profile ──────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, phone, role, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.phone,
    'parent',
    coalesce(nullif(new.raw_user_meta_data ->> 'locale', '')::public.locale, 'en')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ── Guards ───────────────────────────────────────────────────────────────
-- Only owners (or the service role) may assign admin roles.
create or replace function public.guard_profiles()
returns trigger
language plpgsql
as $$
begin
  if public.is_trusted() or public.has_role('owner') then
    return new;
  end if;
  if tg_op = 'INSERT' and new.role <> 'parent' then
    raise exception 'only an owner can assign role %', new.role using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and (new.role is distinct from old.role or new.user_id is distinct from old.user_id) then
    raise exception 'only an owner can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_profiles before insert or update on public.profiles
for each row execute function public.guard_profiles();

-- Parents may rename their family and toggle WhatsApp; billing fields are admin/service only.
create or replace function public.guard_families()
returns trigger
language plpgsql
as $$
begin
  if public.is_trusted() or public.has_role('owner', 'ops') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.plan := 'trial';
    new.plan_renews_at := null;
    new.trial_ends_at := now() + interval '14 days';
    new.purge_scheduled_at := null;
    return new;
  end if;
  if new.plan is distinct from old.plan
     or new.plan_renews_at is distinct from old.plan_renews_at
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'plan and ownership fields are managed by DuDu' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_families before insert or update on public.families
for each row execute function public.guard_families();

-- The family creator becomes an owner member.
create or replace function public.add_family_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.family_members (family_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (family_id, user_id) do update set role = 'owner';
  return new;
end;
$$;
create trigger add_family_owner_member after insert on public.families
for each row execute function public.add_family_owner_member();

-- Parents may only change volume and which child is assigned. Mode goes through rpc_set_mode.
create or replace function public.guard_devices()
returns trigger
language plpgsql
as $$
begin
  if public.is_trusted() or public.has_role('owner', 'ops') then
    return new;
  end if;
  if (to_jsonb(new) - 'volume_pct' - 'child_id' - 'updated_at')
     is distinct from (to_jsonb(old) - 'volume_pct' - 'child_id' - 'updated_at') then
    raise exception 'parents may only change volume and assigned child' using errcode = '42501';
  end if;
  if new.child_id is not null
     and not exists (select 1 from public.children where id = new.child_id and family_id = new.family_id) then
    raise exception 'child does not belong to this family' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_devices before update on public.devices
for each row execute function public.guard_devices();

-- Only owners publish prompts. Publishing stamps published_by/at.
create or replace function public.guard_prompts()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'live' and (tg_op = 'INSERT' or old.status <> 'live') then
    if not (public.is_trusted() or public.has_role('owner')) then
      raise exception 'only an owner can publish prompts' using errcode = '42501';
    end if;
    new.published_at := coalesce(new.published_at, now());
    new.published_by := coalesce(new.published_by, auth.uid());
  end if;
  return new;
end;
$$;
create trigger guard_prompts before insert or update on public.prompts
for each row execute function public.guard_prompts();

alter table public.safety_reviews
  add constraint safety_reviews_distinct_reviewers
  check (second_reviewer_id is null or second_reviewer_id <> reviewer_id);

-- ── Audit: every admin mutation writes audit_log ─────────────────────────
create or replace function public.audit_admin_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  o jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) - 'device_secret_hash' end;
  n jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) - 'device_secret_hash' end;
  diff jsonb := '{}'::jsonb;
  k text;
begin
  if auth.uid() is null or not public.is_admin() then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(n) loop
      if k <> 'updated_at' and (o -> k) is distinct from (n -> k) then
        diff := diff || jsonb_build_object(k, jsonb_build_array(o -> k, n -> k));
      end if;
    end loop;
  elsif tg_op = 'INSERT' then
    diff := jsonb_build_object('new', n);
  else
    diff := jsonb_build_object('old', o);
  end if;
  insert into public.audit_log (actor_id, action, target_table, target_id, diff_json)
  values (auth.uid(), lower(tg_op), tg_table_name, coalesce((n ->> 'id')::uuid, (o ->> 'id')::uuid), diff);
  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'families', 'family_members', 'children', 'devices', 'pairing_codes', 'content_packs',
    'prompts', 'model_routes', 'media_library', 'subscriptions', 'preorders', 'safety_reviews',
    'firmware_releases', 'settings'
  ] loop
    execute format(
      'create trigger audit_admin_mutation after insert or update or delete on public.%I for each row execute function public.audit_admin_mutation()',
      t
    );
  end loop;
end;
$$;

-- ── Enable RLS everywhere ────────────────────────────────────────────────
do $$
declare
  t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- ── Policies ─────────────────────────────────────────────────────────────
-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_owner_all on public.profiles for all to authenticated
  using (public.has_role('owner')) with check (public.has_role('owner'));

-- families
create policy families_select on public.families for select to authenticated
  using (public.is_family_member(id) or owner_user_id = auth.uid() or public.is_admin());
create policy families_insert on public.families for insert to authenticated
  with check (owner_user_id = auth.uid());
create policy families_update on public.families for update to authenticated
  using (public.is_family_owner(id) or public.has_role('owner', 'ops'))
  with check (public.is_family_owner(id) or public.has_role('owner', 'ops'));
create policy families_delete on public.families for delete to authenticated
  using (public.has_role('owner'));

-- family_members
create policy family_members_select on public.family_members for select to authenticated
  using (user_id = auth.uid() or public.is_family_member(family_id) or public.is_admin());
create policy family_members_insert on public.family_members for insert to authenticated
  with check ((public.is_family_owner(family_id) and role = 'guardian') or public.has_role('owner', 'ops'));
create policy family_members_delete on public.family_members for delete to authenticated
  using ((public.is_family_owner(family_id) and role = 'guardian') or public.has_role('owner', 'ops'));

-- children
create policy children_select on public.children for select to authenticated
  using (public.is_family_member(family_id) or public.is_admin());
create policy children_insert on public.children for insert to authenticated
  with check (public.is_family_member(family_id) or public.has_role('owner', 'ops'));
create policy children_update on public.children for update to authenticated
  using (public.is_family_member(family_id) or public.has_role('owner', 'ops'))
  with check (public.is_family_member(family_id) or public.has_role('owner', 'ops'));
create policy children_delete on public.children for delete to authenticated
  using (public.is_family_owner(family_id) or public.has_role('owner'));

-- devices (provisioning is ops/service only; parents pair through rpc_pair_device)
create policy devices_select on public.devices for select to authenticated
  using ((family_id is not null and public.is_family_member(family_id)) or public.is_admin());
create policy devices_update on public.devices for update to authenticated
  using ((family_id is not null and public.is_family_member(family_id)) or public.has_role('owner', 'ops'))
  with check ((family_id is not null and public.is_family_member(family_id)) or public.has_role('owner', 'ops'));
create policy devices_admin_insert on public.devices for insert to authenticated
  with check (public.has_role('owner', 'ops'));
create policy devices_admin_delete on public.devices for delete to authenticated
  using (public.has_role('owner'));

-- pairing_codes: admins read; creation/consumption via service role and rpc_pair_device
create policy pairing_codes_admin on public.pairing_codes for select to authenticated
  using (public.has_role('owner', 'ops'));

-- schedules & reminders: full CRUD for the family
create policy schedules_family on public.schedules for all to authenticated
  using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));
create policy schedules_admin on public.schedules for select to authenticated using (public.is_admin());

create policy reminders_family on public.reminders for all to authenticated
  using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));
create policy reminders_admin on public.reminders for select to authenticated using (public.is_admin());

-- device-written data: family reads, admins read
create policy sessions_select on public.sessions for select to authenticated
  using (public.can_access_device(device_id) or public.can_access_child(child_id) or public.is_admin());

create policy conversations_select on public.conversations for select to authenticated
  using (public.can_access_child(child_id) or public.can_access_device(device_id) or public.is_admin());

-- turns: family reads its own; owner/ops/content read all;
-- support only when a safety review references the turn.
create policy turns_family on public.turns for select to authenticated
  using (public.can_access_conversation(conversation_id));
create policy turns_admin on public.turns for select to authenticated
  using (
    public.has_role('owner', 'ops', 'content')
    or (public.has_role('support') and exists (select 1 from public.safety_reviews r where r.turn_id = turns.id))
  );

create policy homework_select on public.homework_items for select to authenticated
  using (public.can_access_child(child_id) or public.is_admin());
create policy homework_delete on public.homework_items for delete to authenticated
  using (public.can_access_child(child_id));

create policy quizzes_select on public.quizzes for select to authenticated
  using (public.can_access_child(child_id) or public.is_admin());

create policy child_stats_select on public.child_stats for select to authenticated
  using (public.can_access_child(child_id) or public.is_admin());

create policy snapshots_select on public.snapshots for select to authenticated
  using (public.can_access_device(device_id) or public.has_role('owner', 'ops'));
create policy snapshots_delete on public.snapshots for delete to authenticated
  using (public.can_access_device(device_id));

-- content: live packs readable by signed-in users; content team writes
create policy content_packs_select on public.content_packs for select to authenticated
  using (status = 'live' or public.is_admin());
create policy content_packs_write on public.content_packs for all to authenticated
  using (public.has_role('owner', 'content')) with check (public.has_role('owner', 'content'));

create policy prompts_select on public.prompts for select to authenticated using (public.is_admin());
create policy prompts_write on public.prompts for all to authenticated
  using (public.has_role('owner', 'content')) with check (public.has_role('owner', 'content'));

create policy model_routes_select on public.model_routes for select to authenticated using (public.is_admin());
create policy model_routes_write on public.model_routes for all to authenticated
  using (public.has_role('owner')) with check (public.has_role('owner'));

create policy media_select on public.media_library for select to authenticated
  using (
    status = 'approved'
    or (requested_by_family_id is not null and public.is_family_member(requested_by_family_id))
    or public.is_admin()
  );
create policy media_write on public.media_library for all to authenticated
  using (public.has_role('owner', 'content')) with check (public.has_role('owner', 'content'));

-- commerce
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (public.is_family_member(family_id) or public.is_admin());
create policy subscriptions_write on public.subscriptions for all to authenticated
  using (public.has_role('owner', 'ops')) with check (public.has_role('owner', 'ops'));

create policy preorders_admin on public.preorders for select to authenticated using (public.is_admin());
create policy preorders_admin_write on public.preorders for update to authenticated
  using (public.has_role('owner', 'ops')) with check (public.has_role('owner', 'ops'));

-- operations
create policy ai_usage_admin on public.ai_usage_daily for select to authenticated using (public.is_admin());

create policy safety_reviews_select on public.safety_reviews for select to authenticated using (public.is_admin());
create policy safety_reviews_update on public.safety_reviews for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy audit_log_select on public.audit_log for select to authenticated
  using (public.has_role('owner', 'ops'));

create policy firmware_select on public.firmware_releases for select to authenticated using (true);
create policy firmware_write on public.firmware_releases for all to authenticated
  using (public.has_role('owner', 'ops')) with check (public.has_role('owner', 'ops'));

create policy settings_select on public.settings for select to authenticated using (public.is_admin());
create policy settings_write on public.settings for all to authenticated
  using (public.has_role('owner')) with check (public.has_role('owner'));

-- ── Column privileges: the device secret hash never leaves the server ────
revoke select, insert, update on public.devices from anon, authenticated;
do $$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'devices' and column_name <> 'device_secret_hash';
  execute format('grant select (%s) on public.devices to authenticated', cols);
  execute format('grant insert (%s) on public.devices to authenticated', cols);

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'devices'
    and column_name not in ('id', 'created_at', 'device_secret_hash');
  execute format('grant update (%s) on public.devices to authenticated', cols);
end;
$$;

-- Anonymous visitors get nothing from public tables (pre-orders go through a server route).
revoke all on all tables in schema public from anon;
