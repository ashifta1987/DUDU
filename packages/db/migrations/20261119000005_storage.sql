-- DuDu — Phase 1 · 005: storage buckets and object policies
-- Path conventions (first folder = family id so policies can scope by family):
--   homework/{family_id}/{child_id}/{homework_id}/{n}.jpg
--   snapshots/{family_id}/{device_id}/{snapshot_id}.jpg
--   tts-cache/{sha256(text|lang|voice)}.mp3           (service only)
--   media/{type}/{media_id}.mp3                        (approved items readable by signed-in users)
--   firmware/{channel}/{version}.bin                   (service / ops only)

insert into storage.buckets (id, name, public)
values
  ('homework', 'homework', false),
  ('snapshots', 'snapshots', false),
  ('tts-cache', 'tts-cache', false),
  ('media', 'media', false),
  ('firmware', 'firmware', false)
on conflict (id) do nothing;

create or replace function public.storage_family_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return (storage.foldername(object_name))[1]::uuid;
exception when others then
  return null;
end;
$$;

-- Families read their own homework photos and snapshots.
create policy "family reads homework" on storage.objects for select to authenticated
  using (bucket_id = 'homework' and public.is_family_member(public.storage_family_id(name)));

create policy "family reads snapshots" on storage.objects for select to authenticated
  using (bucket_id = 'snapshots' and public.is_family_member(public.storage_family_id(name)));

create policy "family deletes snapshots" on storage.objects for delete to authenticated
  using (bucket_id = 'snapshots' and public.is_family_member(public.storage_family_id(name)));

-- Admins (owner/ops) can read homework & snapshots for support; content team manages media.
create policy "ops reads private media" on storage.objects for select to authenticated
  using (bucket_id in ('homework', 'snapshots', 'firmware') and public.has_role('owner', 'ops'));

create policy "signed-in reads media" on storage.objects for select to authenticated
  using (bucket_id = 'media');

create policy "content manages media" on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.has_role('owner', 'content'))
  with check (bucket_id = 'media' and public.has_role('owner', 'content'));

create policy "ops manages firmware" on storage.objects for all to authenticated
  using (bucket_id = 'firmware' and public.has_role('owner', 'ops'))
  with check (bucket_id = 'firmware' and public.has_role('owner', 'ops'));
