-- Gaji lowongan, IPK minimum lowongan, IPK kandidat, dan sumber Glints.

-- 1. Gaji & IPK minimum pada lowongan (semua opsional; null = tidak diinfokan)
alter table public.jobs add column if not exists salary_min bigint;
alter table public.jobs add column if not exists salary_max bigint;
alter table public.jobs add column if not exists salary_currency text;
alter table public.jobs add column if not exists salary_period text;
alter table public.jobs add column if not exists min_gpa numeric(3,2);

alter table public.jobs drop constraint if exists jobs_salary_range_check;
alter table public.jobs add constraint jobs_salary_range_check
  check (salary_min is null or salary_max is null or salary_min <= salary_max);

alter table public.jobs drop constraint if exists jobs_salary_period_check;
alter table public.jobs add constraint jobs_salary_period_check
  check (salary_period is null or salary_period in ('hour', 'day', 'week', 'month', 'year'));

alter table public.jobs drop constraint if exists jobs_min_gpa_check;
alter table public.jobs add constraint jobs_min_gpa_check
  check (min_gpa is null or (min_gpa >= 0 and min_gpa <= 4));

-- 2. Metode pengambilan baru: halaman publik (Glints)
alter table public.jobs drop constraint if exists jobs_retrieval_method_check;
alter table public.jobs add constraint jobs_retrieval_method_check
  check (retrieval_method in ('public_api', 'jobspy', 'admin_import', 'seed', 'public_page'));

-- 3. IPK kandidat (skala 4.00)
alter table public.resumes add column if not exists gpa numeric(3,2);
alter table public.resumes drop constraint if exists resumes_gpa_check;
alter table public.resumes add constraint resumes_gpa_check
  check (gpa is null or (gpa >= 0 and gpa <= 4));

-- 4. Daftarkan sumber Glints
insert into public.job_sources (name, base_url, is_active)
values ('glints', 'https://glints.com', true)
on conflict (name) do nothing;
