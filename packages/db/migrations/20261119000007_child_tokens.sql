-- DuDu — Phase 2 · 007: child companion tokens
-- The child companion (/kid) has no password. A parent creates a long-lived link token bound to one
-- child; the raw token is shown once (link/QR) and only its sha256 is stored. Parents can revoke.

create table public.child_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  child_id uuid not null references public.children (id) on delete cascade,
  token_hash text not null unique,
  label text,
  created_by uuid references auth.users (id) on delete set null,
  last_used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '365 days'),
  revoked_at timestamptz
);
create index child_tokens_child_idx on public.child_tokens (child_id);

create trigger set_updated_at before update on public.child_tokens
for each row execute function public.set_updated_at();

alter table public.child_tokens enable row level security;

create policy child_tokens_family_select on public.child_tokens for select to authenticated
  using (public.can_access_child(child_id) or public.is_admin());

-- the hash never leaves the server
revoke all on public.child_tokens from anon, authenticated;
grant select (id, created_at, updated_at, child_id, label, created_by, last_used_at, expires_at, revoked_at)
  on public.child_tokens to authenticated;

create or replace function public.hash_child_token(p_token text)
returns text
language sql
immutable
set search_path = public
as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

-- Parent creates a token for their child. Returns the raw token exactly once.
create or replace function public.rpc_create_child_token(p_child_id uuid, p_label text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_token text;
  v_row public.child_tokens;
begin
  if auth.uid() is null or not public.can_access_child(p_child_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.child_tokens (child_id, token_hash, label, created_by)
  values (p_child_id, public.hash_child_token(v_token), nullif(trim(coalesce(p_label, '')), ''), auth.uid())
  returning * into v_row;
  return jsonb_build_object('id', v_row.id, 'token', v_token, 'expires_at', v_row.expires_at);
end;
$$;

create or replace function public.rpc_revoke_child_token(p_token_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_child uuid;
begin
  select child_id into v_child from public.child_tokens where id = p_token_id;
  if v_child is null or not (public.can_access_child(v_child) or public.has_role('owner', 'support')) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.child_tokens set revoked_at = coalesce(revoked_at, now()) where id = p_token_id;
end;
$$;

-- Server-only: resolve a raw token to its child (used by the /kid surface with the service role).
create or replace function public.rpc_resolve_child_token(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_tok public.child_tokens;
  v_child public.children;
begin
  if not public.is_service() then
    raise exception 'service role only' using errcode = '42501';
  end if;
  select * into v_tok from public.child_tokens
  where token_hash = public.hash_child_token(coalesce(p_token, ''))
    and revoked_at is null and expires_at > now();
  if not found then
    return null;
  end if;
  update public.child_tokens set last_used_at = now()
  where id = v_tok.id and (last_used_at is null or last_used_at < now() - interval '5 minutes');
  select * into v_child from public.children where id = v_tok.child_id;
  return jsonb_build_object(
    'token_id', v_tok.id,
    'child', jsonb_build_object(
      'id', v_child.id, 'family_id', v_child.family_id, 'first_name', v_child.first_name,
      'class', v_child.class, 'board', v_child.board, 'languages', v_child.languages,
      'avatar_color', v_child.avatar_color
    )
  );
end;
$$;

revoke execute on function public.hash_child_token(text) from public, anon, authenticated;
revoke execute on function public.rpc_create_child_token(uuid, text) from public, anon;
revoke execute on function public.rpc_revoke_child_token(uuid) from public, anon;
revoke execute on function public.rpc_resolve_child_token(text) from public, anon, authenticated;
grant execute on function public.rpc_create_child_token(uuid, text) to authenticated;
grant execute on function public.rpc_revoke_child_token(uuid) to authenticated;
grant execute on function public.rpc_resolve_child_token(text) to service_role;
