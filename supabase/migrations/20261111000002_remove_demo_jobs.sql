-- Penanda yang sama dipakai oleh web/src/lib/demo-jobs.ts.
-- Pasang constraint terlebih dahulu agar seed tidak dapat masuk saat pembersihan.
alter table public.jobs
  drop constraint if exists jobs_no_demo_jobs,
  add constraint jobs_no_demo_jobs check (
    retrieval_method <> 'seed'
    and lower(source_name) <> 'seed'
    and lower(external_id) not in ('gh-40112', 'li-412988102', 'lev-88a2e1', 'gh-8109620')
    and lower(external_id) not like 'seed-%'
    and lower(external_id) not like '%-seed'
    and id::text not like '33333333-0000-0000-0000-%'
  ) not valid;

delete from public.jobs
where retrieval_method = 'seed'
   or lower(source_name) = 'seed'
   or lower(external_id) in ('gh-40112', 'li-412988102', 'lev-88a2e1', 'gh-8109620')
   or lower(external_id) like 'seed-%'
   or lower(external_id) like '%-seed'
   or id::text like '33333333-0000-0000-0000-%';

alter table public.jobs validate constraint jobs_no_demo_jobs;

update public.job_sources set is_active = false where name = 'seed';
