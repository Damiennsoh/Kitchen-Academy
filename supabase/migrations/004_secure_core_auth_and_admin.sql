-- Applied to the connected Supabase project as secure_core_auth_and_admin.
-- Authorization uses auth.jwt()->'app_metadata'->>'role' = 'admin'.
-- Keep this migration in source control as the local record of the live schema change.

alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.registrations enable row level security;
alter table public.message_logs enable row level security;
alter table public.certificates enable row level security;

create policy if not exists classes_public_select on public.classes
  for select to anon, authenticated using (true);

create policy if not exists students_self_select on public.students
  for select to authenticated
  using (id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy if not exists students_self_insert on public.students
  for insert to authenticated with check (id = (select auth.uid()));

create policy if not exists registrations_self_select on public.registrations
  for select to authenticated
  using (student_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy if not exists registrations_self_insert on public.registrations
  for insert to authenticated with check (student_id = (select auth.uid()));

create policy if not exists registrations_admin_all on public.registrations
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy if not exists message_logs_admin_all on public.message_logs
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy if not exists certificates_admin_all on public.certificates
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy if not exists certificates_self_select on public.certificates
  for select to authenticated
  using (exists (
    select 1 from public.registrations r
    where r.id = registration_id
      and (r.student_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  ));

-- Assign admin role through the Supabase Auth admin API or app_metadata tooling;
-- never use raw_user_meta_data for authorization.
