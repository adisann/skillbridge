-- ==============================================================================
-- SkillBridge Seed: Kamus Skill Data Analyst & BI Analyst + Sumber Lowongan
-- ==============================================================================

-- 1. Insert Verified Job Sources
insert into public.job_sources (name, base_url, is_active)
values
  ('greenhouse', 'https://boards-api.greenhouse.io', true),
  ('lever', 'https://api.lever.co', true),
  ('linkedin', 'https://www.linkedin.com/jobs', true),
  ('seed', 'offline://seed_data', true),
  ('admin_import', 'manual://admin', true)
on conflict (name) do update set is_active = excluded.is_active;

-- 2. Insert Standard Skills Taxonomy for Data Analyst & BI Analyst
insert into public.skills (id, name, category)
values
  -- Database & Query
  ('11111111-0000-0000-0000-000000000001', 'SQL', 'Database & Query'),
  ('11111111-0000-0000-0000-000000000002', 'PostgreSQL', 'Database & Query'),
  ('11111111-0000-0000-0000-000000000003', 'MySQL', 'Database & Query'),
  ('11111111-0000-0000-0000-000000000004', 'BigQuery', 'Data Warehouse & Cloud'),
  ('11111111-0000-0000-0000-000000000005', 'Snowflake', 'Data Warehouse & Cloud'),
  ('11111111-0000-0000-0000-000000000006', 'SQL Server', 'Database & Query'),

  -- Programming & Libraries
  ('11111111-0000-0000-0000-000000000010', 'Python', 'Programming & Scripting'),
  ('11111111-0000-0000-0000-000000000011', 'Pandas', 'Programming & Scripting'),
  ('11111111-0000-0000-0000-000000000012', 'NumPy', 'Programming & Scripting'),
  ('11111111-0000-0000-0000-000000000013', 'R', 'Programming & Scripting'),

  -- Business Intelligence & Visualization
  ('11111111-0000-0000-0000-000000000020', 'Power BI', 'Business Intelligence'),
  ('11111111-0000-0000-0000-000000000021', 'Tableau', 'Business Intelligence'),
  ('11111111-0000-0000-0000-000000000022', 'Looker', 'Business Intelligence'),
  ('11111111-0000-0000-0000-000000000023', 'Metabase', 'Business Intelligence'),
  ('11111111-0000-0000-0000-000000000024', 'DAX', 'Business Intelligence'),
  ('11111111-0000-0000-0000-000000000025', 'Data Visualization', 'Business Intelligence'),

  -- Spreadsheet
  ('11111111-0000-0000-0000-000000000030', 'Microsoft Excel', 'Spreadsheet'),
  ('11111111-0000-0000-0000-000000000031', 'Google Sheets', 'Spreadsheet'),

  -- Analytics, Methodology & Statistics
  ('11111111-0000-0000-0000-000000000040', 'A/B Testing', 'Methodology'),
  ('11111111-0000-0000-0000-000000000041', 'Statistics', 'Methodology'),
  ('11111111-0000-0000-0000-000000000042', 'Cohort Analysis', 'Methodology'),
  ('11111111-0000-0000-0000-000000000043', 'Machine Learning', 'Methodology'),

  -- Modeling & Warehousing
  ('11111111-0000-0000-0000-000000000050', 'Data Modeling', 'Data Architecture'),
  ('11111111-0000-0000-0000-000000000051', 'Data Warehousing', 'Data Architecture'),
  ('11111111-0000-0000-0000-000000000052', 'ETL', 'Data Architecture'),
  ('11111111-0000-0000-0000-000000000053', 'DBT', 'Data Architecture'),
  ('11111111-0000-0000-0000-000000000054', 'Git', 'Engineering Tools'),

  -- Soft Skills & Domain
  ('11111111-0000-0000-0000-000000000060', 'Komunikasi', 'Soft Skills'),
  ('11111111-0000-0000-0000-000000000061', 'Stakeholder Management', 'Soft Skills'),
  ('11111111-0000-0000-0000-000000000062', 'Administrasi', 'Operations')
on conflict (name) do nothing;

-- 3. Insert Skill Aliases (Normalisasi Sinonim & Typo)
insert into public.skill_aliases (alias, skill_id)
values
  ('postgres', '11111111-0000-0000-0000-000000000002'),
  ('postgresql', '11111111-0000-0000-0000-000000000002'),
  ('google bigquery', '11111111-0000-0000-0000-000000000004'),
  ('big query', '11111111-0000-0000-0000-000000000004'),
  ('py', '11111111-0000-0000-0000-000000000010'),
  ('python3', '11111111-0000-0000-0000-000000000010'),
  ('powerbi', '11111111-0000-0000-0000-000000000020'),
  ('power-bi', '11111111-0000-0000-0000-000000000020'),
  ('bi', '11111111-0000-0000-0000-000000000020'),
  ('excel', '11111111-0000-0000-0000-000000000030'),
  ('ms excel', '11111111-0000-0000-0000-000000000030'),
  ('sheets', '11111111-0000-0000-0000-000000000031'),
  ('ab testing', '11111111-0000-0000-0000-000000000040'),
  ('a/b test', '11111111-0000-0000-0000-000000000040'),
  ('statistika', '11111111-0000-0000-0000-000000000041'),
  ('data warehouse', '11111111-0000-0000-0000-000000000051'),
  ('dwh', '11111111-0000-0000-0000-000000000051')
on conflict (alias) do nothing;

