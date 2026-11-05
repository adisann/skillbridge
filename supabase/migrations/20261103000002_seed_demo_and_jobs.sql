-- ==============================================================================
-- SkillBridge Seed: Akun Demo Juri, Akun Admin, dan Importer Lowongan Kerja
-- ==============================================================================

-- 1. Create Demo Users in auth.users (if running on Supabase instance)
-- Menggunakan pgcrypto crypt() untuk hashing password aman
do $$
declare
  juri_uid uuid := '00000000-0000-0000-0000-000000000001';
  admin_uid uuid := '00000000-0000-0000-0000-000000000002';
  userb_uid uuid := '00000000-0000-0000-0000-000000000003';
begin
  -- Insert into auth.users if not present
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    values
      (
        juri_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'juri@skillbridge.demo', crypt('DemoJuriInvofest2026!', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Budi Pratama (Juri Lomba)"}', now(), now()
      ),
      (
        admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'admin@skillbridge.demo', crypt('AdminSkillBridge2026!', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Administrator SkillBridge"}', now(), now()
      ),
      (
        userb_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'userb@skillbridge.demo', crypt('UserBInvofest2026!', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Rina Maharani"}', now(), now()
      )
    on conflict (id) do nothing;
  end if;

  -- Insert corresponding Profiles in public.profiles
  insert into public.profiles (id, full_name, email, role, target_role)
  values
    (juri_uid, 'Budi Pratama (Juri Lomba)', 'juri@skillbridge.demo', 'user', 'Data Analyst'),
    (admin_uid, 'Administrator SkillBridge', 'admin@skillbridge.demo', 'admin', 'Data Analyst'),
    (userb_uid, 'Rina Maharani', 'userb@skillbridge.demo', 'user', 'Data Analyst')
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name;
end $$;

-- 2. Insert Resumes for Demo Users
insert into public.resumes (id, user_id, filename, file_url, parsed_text, education, experience_years, is_active)
values
  (
    '22222222-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'CV_Budi_Pratama_DataAnalyst.pdf',
    'https://r2.skillbridge.id/resumes/demo/budi_pratama.pdf',
    'Lulusan S1 Matematika dengan 2 tahun pengalaman analisis data transaksi di perbankan digital. Mahir SQL PostgreSQL, Python Pandas, Microsoft Excel, dan visualisasi data.',
    'S1 Matematika & Statistika',
    2,
    true
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'CV_Rina_FreshGraduate.pdf',
    'https://r2.skillbridge.id/resumes/demo/rina_maharani.pdf',
    'Fresh graduate Manajemen Bisnis dengan pengalaman menggunakan spreadsheet Excel dan Google Sheets.',
    'S1 Manajemen Bisnis',
    0,
    true
  )
on conflict (id) do nothing;

-- 3. Link Resume Skills
insert into public.resume_skills (resume_id, skill_id, is_claimed_by_user, evidence)
values
  -- Budi Pratama (Match Skills)
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', false, 'Query database transaksi PostgreSQL di CV'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', false, 'PostgreSQL database administration'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000010', false, 'Automasi script Python di CV'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000011', false, 'Manipulasi dataset Pandas'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000030', false, 'Microsoft Excel Pivot & VLOOKUP'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000025', false, 'Portofolio visualisasi data performa produk'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000041', false, 'Latar belakang S1 Matematika & Statistika'),

  -- Rina Maharani (Underqualified)
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000030', false, 'Excel dasar'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000031', false, 'Google Sheets magang'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000060', false, 'Komunikasi tim')
on conflict do nothing;

-- 4. Insert Verified Curated Jobs
insert into public.jobs (
  id, source_name, external_id, source_url, title, canonical_title, company, location,
  employment_type, seniority, experience_years_min, education, description, content_hash,
  retrieval_method, retrieved_at, is_active
)
values
  (
    '33333333-0000-0000-0000-000000000001',
    'greenhouse',
    'gh-40112',
    'https://boards.greenhouse.io/nusantarafintech/jobs/40112',
    'Junior Data Analyst',
    'Data Analyst',
    'PT Nusantara FinTech',
    'Jakarta, Indonesia (Hybrid)',
    'Full-time',
    'Junior',
    1,
    'Bachelor',
    'Mencari Junior Data Analyst untuk mengekstrak data dari data warehouse, menyiapkan dashboard performa fitur fintech, dan query SQL.',
    'hash_gh_40112',
    'public_api',
    now(),
    true
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    'linkedin',
    'li-412988102',
    'https://www.linkedin.com/jobs/view/412988102',
    'Business Intelligence (BI) Analyst',
    'BI Analyst',
    'Karya Logistik Express',
    'Bandung, Indonesia (Onsite)',
    'Full-time',
    'Mid',
    2,
    'Bachelor',
    'Dibutuhkan BI Analyst berpengalaman untuk mengoptimasi rute armada dan efisiensi rantai pasok dengan Power BI dan SQL.',
    'hash_li_412988102',
    'jobspy',
    now(),
    true
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    'lever',
    'lev-88a2e1',
    'https://jobs.lever.co/asiaecommerce/88a2e1',
    'Commercial Data Analyst',
    'Data Analyst',
    'PT Asia E-Commerce Global',
    'Jakarta, Indonesia (Remote)',
    'Full-time',
    'Junior',
    1,
    'Bachelor',
    'Membantu tim merchant dan marketing menganalisis tren promosi bulanan dan customer lifetime value di platform e-commerce.',
    'hash_lev_88a2e1',
    'public_api',
    now(),
    true
  )
on conflict (source_name, external_id) do nothing;

-- 5. Insert Job Skills Requirements
insert into public.job_skills (job_id, skill_id, is_mandatory, requirement_snippet)
values
  -- Junior Data Analyst @ FinTech
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', true, 'Mahir SQL untuk query multi-table dan agregasi data'),
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000030', true, 'Kemampuan analisis spreadsheet dengan Microsoft Excel'),
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000025', true, 'Visualisasi data analitis dan pelaporan performa'),
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000010', false, 'Pengalaman dasar pemrograman Python (Pandas/NumPy)'),
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000021', false, 'Pengalaman dengan Tableau Desktop'),

  -- BI Analyst @ Logistik
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', true, 'Mahir SQL tingkat lanjut (Window Functions, CTE)'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000020', true, 'Keahlian pembuatan dashboard Power BI dan kalkulasi DAX'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000050', true, 'Pemodelan data relasional dan star schema')
on conflict (job_id, skill_id) do nothing;

-- 6. Insert Matches for Juri Demo
insert into public.matches (
  user_id, resume_id, job_id, match_status, score, score_breakdown, factors_supporting, factors_limiting
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000001',
    'match',
    88.0,
    '[{"label":"Skill Wajib (35%)","score":95},{"label":"Skill Tambahan (20%)","score":80},{"label":"Pengalaman (15%)","score":90},{"label":"Senioritas (10%)","score":90},{"label":"Semantik (20%)","score":85}]'::jsonb,
    array['Semua persyaratan wajib (SQL, Excel, Visualisasi Data) terbukti ada di CV', 'Python Pandas memberi nilai tambah'],
    array['Tableau belum ditemukan di CV']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000002',
    'underqualified',
    52.0,
    '[{"label":"Skill Wajib (35%)","score":45},{"label":"Skill Tambahan (20%)","score":60},{"label":"Pengalaman (15%)","score":70},{"label":"Senioritas (10%)","score":80},{"label":"Semantik (20%)","score":50}]'::jsonb,
    array['Fondasi SQL solid'],
    array['Persyaratan wajib Power BI & DAX belum ditemukan di CV', 'Data modeling dimensional belum terbukti']
  )
on conflict (resume_id, job_id) do nothing;

-- 7. Insert Saved Jobs & Learning Items for Juri Demo
insert into public.saved_jobs (user_id, job_id)
values
  ('00000000-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001')
on conflict (user_id, job_id) do nothing;

insert into public.learning_items (user_id, skill_name, reason, resource_suggestion, is_done, priority)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Power BI & DAX',
    'Diminta oleh 89% lowongan BI Analyst. Belum ditemukan di CV aktif Anda.',
    'Modul Praktis Power BI Desktop & DAX: Visualisasi Data Rantai Pasok',
    false,
    'Tinggi'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Tableau Desktop Fundamental',
    'Menambah portofolio visualisasi dashboard untuk menaikkan skor kecocokan.',
    'Tutorial Executive KPI Dashboard di Tableau Public',
    false,
    'Tinggi'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'SQL Window Functions',
    'Fondasi query analitis tingkat lanjut.',
    'Latihan Interaktif SQL Window Functions di LeetCode',
    true,
    'Menengah'
  );

-- 8. Insert Audit Logs in worker_runs
insert into public.worker_runs (source_name, retrieval_method, status, fetched_count, inserted_count, updated_count, duplicate_count, failed_count, error_message)
values
  ('greenhouse', 'public_api', 'success', 15, 12, 0, 3, 0, null),
  ('lever', 'public_api', 'success', 10, 8, 0, 2, 0, null),
  ('linkedin', 'jobspy', 'success', 8, 6, 0, 2, 0, null),
  ('seed', 'seed', 'success', 3, 3, 0, 0, 0, null);

