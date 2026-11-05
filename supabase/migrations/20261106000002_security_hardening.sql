-- ==============================================================================
-- Hardening keamanan
-- 1. Pengguna tidak boleh menaikkan role sendiri (sebelumnya policy update profiles
--    mengizinkan user mengubah kolom role miliknya dari browser lewat anon key).
-- 2. Cache AI: tulis hanya lewat service role. Policy insert/update lama mengizinkan
--    anon (auth.uid() is null) menulis cache job_knowledge yang dibaca semua orang.
-- ==============================================================================

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() null = service role / proses internal (mis. trigger signup): dibiarkan.
  if (select auth.uid()) is not null and not (select public.is_admin()) then
    if tg_op = 'INSERT' then
      new.role := 'user';
    else
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

drop policy if exists "Service role and users can insert cache" on public.ai_chat_cache;
drop policy if exists "Service role and users can update cache" on public.ai_chat_cache;
