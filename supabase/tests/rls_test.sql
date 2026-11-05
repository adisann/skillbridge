-- ==============================================================================
-- SkillBridge RLS (Row-Level Security) Verification Test Script
-- Run against PostgreSQL instance to verify data isolation and admin boundary
-- ==============================================================================

begin;

-- Create pgTAP extension if available, or use standard transactional assertions
create temporary table rls_test_results (
  test_name text primary key,
  passed boolean not null,
  detail text
);

-- ------------------------------------------------------------------------------
-- TEST 1: Pengguna A tidak bisa membaca profil Pengguna B
-- ------------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

do $$
declare
  v_count int;
begin
  -- Coba akses profil user B (00000000-0000-0000-0000-000000000003)
  select count(*) into v_count from public.profiles
  where id = '00000000-0000-0000-0000-000000000003';

  if v_count = 0 then
    insert into rls_test_results values ('User cannot read another user profile', true, 'Akses diblokir oleh RLS (count = 0)');
  else
    insert into rls_test_results values ('User cannot read another user profile', false, 'Bocor! User bisa membaca profil lain.');
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- TEST 2: Pengguna A tidak bisa membaca CV atau hasil Match Pengguna B
-- ------------------------------------------------------------------------------
do $$
declare
  v_resumes_count int;
  v_matches_count int;
begin
  select count(*) into v_resumes_count from public.resumes
  where user_id = '00000000-0000-0000-0000-000000000003';

  select count(*) into v_matches_count from public.matches
  where user_id = '00000000-0000-0000-0000-000000000003';

  if v_resumes_count = 0 and v_matches_count = 0 then
    insert into rls_test_results values ('User cannot read another user resumes and matches', true, 'Akses CV dan Match user lain diblokir RLS');
  else
    insert into rls_test_results values ('User cannot read another user resumes and matches', false, 'Bocor! User bisa membaca CV/Match user lain.');
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- TEST 3: Non-Admin tidak bisa membaca audit log worker_runs
-- ------------------------------------------------------------------------------
do $$
declare
  v_runs_count int;
begin
  select count(*) into v_runs_count from public.worker_runs;

  if v_runs_count = 0 then
    insert into rls_test_results values ('Non-admin cannot view worker_runs audit log', true, 'Akses audit worker_runs diblokir RLS untuk non-admin');
  else
    insert into rls_test_results values ('Non-admin cannot view worker_runs audit log', false, 'Bocor! Non-admin bisa membaca worker_runs.');
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- TEST 4: Admin bisa membaca semua profil dan data audit worker_runs
-- ------------------------------------------------------------------------------
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';

do $$
declare
  v_admin_profile_count int;
  v_admin_runs_count int;
begin
  select count(*) into v_admin_profile_count from public.profiles;
  select count(*) into v_admin_runs_count from public.worker_runs;

  if v_admin_profile_count >= 3 and v_admin_runs_count >= 4 then
    insert into rls_test_results values ('Admin can view all profiles and worker runs', true, 'Admin berhasil mengakses seluruh data audit');
  else
    insert into rls_test_results values ('Admin can view all profiles and worker runs', false, 'Gagal! Admin terhalang RLS.');
  end if;
end $$;

-- Print Summary of Results
select test_name, case when passed then 'PASSED' else 'FAILED' end as status, detail
from rls_test_results;

rollback;

