-- Fix: policies that check staff membership by querying the staff table
-- recurse infinitely (42P17) because the staff table's own RLS re-applies
-- inside the subquery. Standard fix: a SECURITY DEFINER helper that
-- bypasses RLS for the membership check.

create or replace function is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from staff where id = auth.uid());
$$;

-- Recreate every policy that referenced staff directly.

drop policy "staff manage buildings" on buildings;
create policy "staff manage buildings"
  on buildings for all
  using (is_staff())
  with check (is_staff());

drop policy "staff manage rooms" on rooms;
create policy "staff manage rooms"
  on rooms for all
  using (is_staff())
  with check (is_staff());

drop policy "staff can read staff list" on staff;
create policy "staff can read staff list"
  on staff for select
  using (is_staff());

drop policy "staff can read all reports" on reports;
create policy "staff can read all reports"
  on reports for select
  using (is_staff());

drop policy "staff can update reports" on reports;
create policy "staff can update reports"
  on reports for update
  using (is_staff())
  with check (is_staff());

drop policy "staff can read report history" on report_status_history;
create policy "staff can read report history"
  on report_status_history for select
  using (is_staff());

drop policy "staff manage service types" on service_types;
create policy "staff manage service types"
  on service_types for all
  using (is_staff())
  with check (is_staff());

drop policy "staff can read report photos" on storage.objects;
create policy "staff can read report photos"
  on storage.objects for select
  using (bucket_id = 'report-photos' and is_staff());
