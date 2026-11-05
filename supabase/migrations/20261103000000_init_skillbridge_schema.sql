-- ==============================================================================
-- SkillBridge Database Migration (INVOFEST 2026)
-- Target: Clean schema initialization, pgvector, HNSW index, RLS & Admin Role
-- ==============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ------------------------------------------------------------------------------
-- 2. Profiles Table (Linked with Supabase auth.users)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  target_role text default 'Data Analyst',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for RLS and lookup
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_email on public.profiles (email);

-- Helper function: Is Admin Check
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ------------------------------------------------------------------------------
-- 3. Resumes Table
-- ------------------------------------------------------------------------------
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  filename text not null,
  file_url text,
  parsed_text text,
  education text,
  experience_years int default 0 not null,
  is_active boolean default true not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resumes_user_id on public.resumes (user_id);

-- ------------------------------------------------------------------------------
-- 4. Skills & Skill Aliases Taxonomy Tables
-- ------------------------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_skills_name on public.skills (name);
create index if not exists idx_skills_category on public.skills (category);

create table if not exists public.skill_aliases (
  id uuid primary key default gen_random_uuid(),
  alias text unique not null,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_skill_aliases_alias on public.skill_aliases (alias);
create index if not exists idx_skill_aliases_skill_id on public.skill_aliases (skill_id);

-- ------------------------------------------------------------------------------
-- 5. Resume Skills Table (Extracted & User-Corrected Skills)
-- ------------------------------------------------------------------------------
create table if not exists public.resume_skills (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  is_claimed_by_user boolean default false not null,
  evidence text,
  created_at timestamptz not null default now(),
  constraint uq_resume_skills unique (resume_id, skill_id)
);

create index if not exists idx_resume_skills_resume_id on public.resume_skills (resume_id);
create index if not exists idx_resume_skills_skill_id on public.resume_skills (skill_id);

-- ------------------------------------------------------------------------------
-- 6. Job Sources Table
-- ------------------------------------------------------------------------------
create table if not exists public.job_sources (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  base_url text not null,
  is_active boolean default true not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 7. Jobs Table (with pgvector embedding & HNSW Index)
-- ------------------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.job_sources(id) on delete set null,
  source_name text not null,
  external_id text not null,
  source_url text not null,
  title text not null,
  canonical_title text not null,
  company text not null,
  location text not null,
  employment_type text default 'Full-time' not null,
  seniority text,
  experience_years_min int,
  education text,
  description text not null,
  content_hash text not null,
  retrieval_method text not null check (retrieval_method in ('public_api', 'jobspy', 'admin_import', 'seed')),
  retrieved_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean default true not null,
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_jobs_source_external unique (source_name, external_id)
);

create index if not exists idx_jobs_canonical_title on public.jobs (canonical_title);
create index if not exists idx_jobs_is_active on public.jobs (is_active);
create index if not exists idx_jobs_source_id on public.jobs (source_id);

-- HNSW Vector Index for Fast Cosine Semantic Search
create index if not exists jobs_embedding_hnsw_idx
  on public.jobs using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ------------------------------------------------------------------------------
-- 8. Job Skills Table
-- ------------------------------------------------------------------------------
create table if not exists public.job_skills (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  is_mandatory boolean default true not null,
  requirement_snippet text,
  constraint uq_job_skills unique (job_id, skill_id)
);

create index if not exists idx_job_skills_job_id on public.job_skills (job_id);
create index if not exists idx_job_skills_skill_id on public.job_skills (skill_id);

-- ------------------------------------------------------------------------------
-- 9. Matches Table (Kalkulasi Kecocokan Transparan CV vs Lowongan)
-- ------------------------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  match_status text not null check (match_status in ('match', 'underqualified', 'potentially_overqualified', 'insufficient_evidence')),
  score numeric(5,2) not null,
  score_breakdown jsonb not null default '[]'::jsonb,
  factors_supporting text[] not null default '{}'::text[],
  factors_limiting text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  constraint uq_matches_resume_job unique (resume_id, job_id)
);

create index if not exists idx_matches_user_id on public.matches (user_id);
create index if not exists idx_matches_resume_id on public.matches (resume_id);
create index if not exists idx_matches_job_id on public.matches (job_id);

-- ------------------------------------------------------------------------------
-- 10. Saved Jobs Table
-- ------------------------------------------------------------------------------
create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_saved_jobs_user_job unique (user_id, job_id)
);

create index if not exists idx_saved_jobs_user_id on public.saved_jobs (user_id);
create index if not exists idx_saved_jobs_job_id on public.saved_jobs (job_id);

-- ------------------------------------------------------------------------------
-- 11. Learning Items Table (Tracking Rencana Belajar)
-- ------------------------------------------------------------------------------
create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_name text not null,
  reason text,
  resource_suggestion text,
  is_done boolean default false not null,
  priority text default 'Menengah' not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_learning_items_user_id on public.learning_items (user_id);

-- ------------------------------------------------------------------------------
-- 12. Worker Runs Audit Table
-- ------------------------------------------------------------------------------
create table if not exists public.worker_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  retrieval_method text not null,
  status text not null check (status in ('success', 'failed', 'running')),
  fetched_count int default 0 not null,
  inserted_count int default 0 not null,
  updated_count int default 0 not null,
  duplicate_count int default 0 not null,
  failed_count int default 0 not null,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_worker_runs_created_at on public.worker_runs (created_at desc);

-- ------------------------------------------------------------------------------
-- 13. Enable Row-Level Security (RLS) on ALL Tables
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.skills enable row level security;
alter table public.skill_aliases enable row level security;
alter table public.resume_skills enable row level security;
alter table public.job_sources enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.matches enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.learning_items enable row level security;
alter table public.worker_runs enable row level security;

-- ------------------------------------------------------------------------------
-- 14. Define RLS Policies (Menggunakan pola cached `(select auth.uid())`)
-- ------------------------------------------------------------------------------

-- PROFILES
create policy "Users can view their own profile or admin views all"
  on public.profiles for select
  using ((select auth.uid()) = id or (select public.is_admin()));

create policy "Users can update their own profile or admin updates all"
  on public.profiles for update
  using ((select auth.uid()) = id or (select public.is_admin()));

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id or (select public.is_admin()));

-- RESUMES
create policy "Users can select own resumes or admin views all"
  on public.resumes for select
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users can insert own resumes"
  on public.resumes for insert
  with check ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users can update own resumes"
  on public.resumes for update
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users can delete own resumes"
  on public.resumes for delete
  using ((select auth.uid()) = user_id or (select public.is_admin()));

-- RESUME SKILLS
create policy "Users can view skills of own resumes"
  on public.resume_skills for select
  using (
    exists (
      select 1 from public.resumes
      where resumes.id = resume_skills.resume_id
        and (resumes.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy "Users can manage skills of own resumes"
  on public.resume_skills for all
  using (
    exists (
      select 1 from public.resumes
      where resumes.id = resume_skills.resume_id
        and (resumes.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

-- SKILLS & ALIASES (Public read, admin write)
create policy "Anyone can read skills taxonomy"
  on public.skills for select
  using (true);

create policy "Only admin can write skills"
  on public.skills for all
  using ((select public.is_admin()));

create policy "Anyone can read skill aliases"
  on public.skill_aliases for select
  using (true);

create policy "Only admin can write skill aliases"
  on public.skill_aliases for all
  using ((select public.is_admin()));

-- JOB SOURCES & JOBS (Public read active, admin manage all)
create policy "Anyone can read active job sources"
  on public.job_sources for select
  using (is_active = true or (select public.is_admin()));

create policy "Only admin can manage job sources"
  on public.job_sources for all
  using ((select public.is_admin()));

create policy "Anyone can read active jobs"
  on public.jobs for select
  using (is_active = true or (select public.is_admin()));

create policy "Only admin can manage jobs"
  on public.jobs for all
  using ((select public.is_admin()));

create policy "Anyone can read job skills"
  on public.job_skills for select
  using (true);

create policy "Only admin can manage job skills"
  on public.job_skills for all
  using ((select public.is_admin()));

-- MATCHES (Strict privacy: user only sees their own match calculations)
create policy "Users can view own match results"
  on public.matches for select
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users can insert own match results"
  on public.matches for insert
  with check ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users can update own match results"
  on public.matches for update
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users can delete own match results"
  on public.matches for delete
  using ((select auth.uid()) = user_id or (select public.is_admin()));

-- SAVED JOBS (User only sees their saved jobs)
create policy "Users can view own saved jobs"
  on public.saved_jobs for select
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users can manage own saved jobs"
  on public.saved_jobs for all
  using ((select auth.uid()) = user_id or (select public.is_admin()));

-- LEARNING ITEMS (User only sees their learning items)
create policy "Users can view own learning items"
  on public.learning_items for select
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "Users can manage own learning items"
  on public.learning_items for all
  using ((select auth.uid()) = user_id or (select public.is_admin()));

-- WORKER RUNS (CRITICAL: NON-ADMIN TIDAK BISA MELIHAT/MENGUBAH AUDIT LOG)
create policy "Only admin can view worker runs audit"
  on public.worker_runs for select
  using ((select public.is_admin()));

create policy "Only admin can insert or update worker runs"
  on public.worker_runs for all
  using ((select public.is_admin()));

-- ------------------------------------------------------------------------------
-- 15. Trigger for New User Signup in Supabase Auth
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role, target_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    case when new.email = 'admin@skillbridge.demo' then 'admin' else 'user' end,
    'Data Analyst'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

