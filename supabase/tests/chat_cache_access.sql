-- Test database fixtures are created by run-career-learning.mjs.
begin;
insert into public.ai_chat_cache(cache_type,job_id,user_id,content_hash,prompt_key,response_text)
values
  ('job_knowledge','00000000-0000-0000-0000-000000000003',null,'fixture','fixture','General answer fixture'),
  ('cv_analysis','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','fixture','fixture','Private answer fixture');
grant select on public.ai_chat_cache to anon, authenticated;

set local role anon;
do $$ begin
  if exists(select 1 from public.ai_chat_cache) then
    raise exception 'Anonymous user can enumerate AI answers';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ begin
  if (select count(*) from public.ai_chat_cache) <> 1 or
     exists(select 1 from public.ai_chat_cache where cache_type <> 'cv_analysis') then
    raise exception 'Owner cannot read only their private analysis';
  end if;
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$ begin
  if exists(select 1 from public.ai_chat_cache) then
    raise exception 'Another account can read private AI answers';
  end if;
end $$;
reset role;
rollback;
