-- Migration: 20261104000003_ai_chat_cache.sql
-- Description: Table for Multi-Level AI Chatbot Caching (Job Knowledge & CV Analysis)

create table if not exists public.ai_chat_cache (
  id uuid primary key default gen_random_uuid(),
  cache_type text not null check (cache_type in ('job_knowledge', 'cv_analysis')),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content_hash text not null,
  prompt_key text not null,
  response_text text not null,
  provider text not null default 'gemini',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint for cache entries
create unique index if not exists uq_ai_chat_cache_job_knowledge 
  on public.ai_chat_cache (job_id, content_hash, prompt_key) 
  where cache_type = 'job_knowledge';

create unique index if not exists uq_ai_chat_cache_cv_analysis 
  on public.ai_chat_cache (user_id, job_id, content_hash, prompt_key) 
  where cache_type = 'cv_analysis';

-- Lookup performance indexes
create index if not exists idx_ai_chat_cache_lookup 
  on public.ai_chat_cache (cache_type, job_id, content_hash, prompt_key);

create index if not exists idx_ai_chat_cache_user 
  on public.ai_chat_cache (user_id, job_id);

-- Enable Row Level Security (RLS)
alter table public.ai_chat_cache enable row level security;

-- Policies:
-- 1. Job Knowledge is public/reusable across all users for identical job content
create policy "Anyone can read job knowledge cache"
  on public.ai_chat_cache for select
  using (cache_type = 'job_knowledge');

-- 2. CV Analysis is strictly private to the owner
create policy "Users can only read own cv analysis cache"
  on public.ai_chat_cache for select
  using (cache_type = 'cv_analysis' and (select auth.uid()) = user_id);

-- 3. Service role can insert or update cache
create policy "Service role and users can insert cache"
  on public.ai_chat_cache for insert
  with check (
    cache_type = 'job_knowledge' or 
    ((select auth.uid()) = user_id or (select auth.uid()) is null)
  );

create policy "Service role and users can update cache"
  on public.ai_chat_cache for update
  using (
    cache_type = 'job_knowledge' or 
    ((select auth.uid()) = user_id or (select auth.uid()) is null)
  );

