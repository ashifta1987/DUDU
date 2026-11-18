-- DuDu — Phase 1 · 006: hardening from the Supabase security advisor
-- 1) Pin search_path on every function that lacked it (lint 0011).
-- 2) Keep internal helpers and trigger functions off the anonymous REST surface (lint 0028).
--    RLS helpers must stay executable by `authenticated`: policies call them as the signed-in user.

alter function public.set_updated_at() set search_path = public;
alter function public.is_service() set search_path = public;
alter function public.is_trusted() set search_path = public;
alter function public.today_ist() set search_path = public;
alter function public.guard_profiles() set search_path = public;
alter function public.guard_families() set search_path = public;
alter function public.guard_devices() set search_path = public;
alter function public.guard_prompts() set search_path = public;
alter function public.storage_family_id(text) set search_path = public, storage;

revoke execute on function public.auth_role() from public, anon;
revoke execute on function public.has_role(variadic public.user_role[]) from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_family_member(uuid) from public, anon;
revoke execute on function public.is_family_owner(uuid) from public, anon;
revoke execute on function public.can_access_child(uuid) from public, anon;
revoke execute on function public.can_access_device(uuid) from public, anon;
revoke execute on function public.can_access_conversation(uuid) from public, anon;
revoke execute on function public.is_service() from public, anon;
revoke execute on function public.is_trusted() from public, anon;
revoke execute on function public.today_ist() from public, anon;
revoke execute on function public.storage_family_id(text) from public, anon;

-- trigger functions: never callable through the API by anyone
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.add_family_owner_member() from public, anon, authenticated;
revoke execute on function public.audit_admin_mutation() from public, anon, authenticated;
revoke execute on function public.guard_profiles() from public, anon, authenticated;
revoke execute on function public.guard_families() from public, anon, authenticated;
revoke execute on function public.guard_devices() from public, anon, authenticated;
revoke execute on function public.guard_prompts() from public, anon, authenticated;

-- helpers used by RLS policies and storage policies stay granted to signed-in users
grant execute on function public.auth_role() to authenticated;
grant execute on function public.has_role(variadic public.user_role[]) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.is_family_owner(uuid) to authenticated;
grant execute on function public.can_access_child(uuid) to authenticated;
grant execute on function public.can_access_device(uuid) to authenticated;
grant execute on function public.can_access_conversation(uuid) to authenticated;
grant execute on function public.is_service() to authenticated;
grant execute on function public.is_trusted() to authenticated;
grant execute on function public.today_ist() to authenticated;
grant execute on function public.storage_family_id(text) to authenticated;
