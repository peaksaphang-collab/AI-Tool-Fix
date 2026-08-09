-- Private bucket for report photos. Nobody browses it directly — the public
-- form uploads via a signed upload URL, and staff view photos via signed
-- read URLs generated server-side. No object is ever public.

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', false)
on conflict (id) do nothing;

create policy "anyone can upload a report photo"
  on storage.objects for insert
  with check (bucket_id = 'report-photos');

create policy "staff can read report photos"
  on storage.objects for select
  using (
    bucket_id = 'report-photos'
    and exists (select 1 from staff where id = auth.uid())
  );
