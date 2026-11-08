-- Run only in a disposable database initialized with two fixture users and historical duplicates.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$
declare first_item public.learning_items; next_item public.learning_items; rid uuid; second_rid uuid; saved_count int;
begin
  if (select count(*) from public.learning_items) <> 2 then raise exception 'Legacy rows were lost'; end if;
  if (select count(*) from public.learning_items where duplicate_of is not null) <> 1 then raise exception 'Legacy conflict not flagged'; end if;
  first_item := public.add_learning_item('teamwork','new reason','Tinggi','new resource');
  if first_item.priority <> 'Menengah' or not first_item.is_done or first_item.reason <> 'old reason' then raise exception 'Existing fields overwritten'; end if;
  update public.learning_items set notes = 'Coursera https://example.test/course' where id = first_item.id;
  next_item := public.add_learning_item('  TEAMWORK  ','different','Rendah','');
  if first_item.id <> next_item.id or next_item.notes <> 'Coursera https://example.test/course' then raise exception 'Retry changed item'; end if;
  first_item := public.add_learning_item('PostgreSQL','','Sedang','');
  next_item := public.add_learning_item('postgres','','Tinggi','');
  if first_item.id <> next_item.id then raise exception 'Alias not deduplicated'; end if;
  next_item := public.add_learning_item('SQL','','Tinggi','');
  if first_item.id = next_item.id then raise exception 'SQL collapsed into PostgreSQL'; end if;
  begin
    insert into public.learning_items(user_id,skill_name) values(auth.uid(),'  TeamWork ');
    raise exception 'Direct insert bypassed uniqueness';
  exception when unique_violation then null; end;
  select count(*) into saved_count from public.learning_items;
  rid := public.save_resume_profile(null,'Data CV.pdf',null,'S1',3.5,0.5,'','Data Scientist',
    '[{"name":"Python","claimed":false,"needsReview":true,"evidence":"Python data project"}]','Data Scientist');
  second_rid := public.save_resume_profile(null,'Design CV.pdf',null,'S1',null,1.25,'','Designer',
    '[{"name":"Figma","claimed":true,"needsReview":false}]','Designer');
  if rid = second_rid or (select count(*) from public.resumes) <> 2 then raise exception 'CV overwritten'; end if;
  if (select experience_years from public.resumes where id=rid) <> 0.5 or (select experience_years from public.resumes where id=second_rid) <> 1.25 then raise exception 'Months truncated'; end if;
  perform public.set_career_context(rid,'Data Scientist');
  if (select id from public.resumes where is_active) <> rid then raise exception 'Wrong active CV'; end if;
  if (select cardinality(target_roles) from public.profiles where id=auth.uid()) <> 3 then raise exception 'Targets lost'; end if;
  perform set_config('test.victim_resume_id',rid::text,true);
  if (select count(*) from public.saved_jobs) <> 1 then raise exception 'Saved jobs lost on context change'; end if;
  if (select count(*) from public.learning_items) <> saved_count then raise exception 'Learning lost on context change'; end if;
  perform public.claim_resume_skill('Teamwork');
  if not exists(select 1 from public.resume_skills rs join public.skills s on s.id=rs.skill_id where rs.resume_id=rid and s.name='Teamwork' and is_claimed_by_user) then raise exception 'Claim lost'; end if;
  perform public.claim_resume_skill('Python');
  if exists(select 1 from public.resume_skills rs join public.skills s on s.id=rs.skill_id where rs.resume_id=rid and s.name='Python' and is_claimed_by_user) then raise exception 'Extraction provenance overwritten'; end if;
  begin
    perform public.save_resume_profile(rid,'Broken CV',null,null,null,null,'','X','[{"name":""}]',null);
    raise exception 'Invalid skill accepted';
  exception when others then
    if sqlerrm = 'Invalid skill accepted' then raise; end if;
  end;
  if (select filename from public.resumes where id=rid) <> 'Data CV.pdf' then raise exception 'Failed save was not rolled back'; end if;
end;
$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$
declare victim uuid := current_setting('test.victim_resume_id')::uuid;
begin
  if exists(select 1 from public.learning_items) or exists(select 1 from public.resumes) then raise exception 'RLS leaked another account'; end if;
  begin
    perform public.set_career_context(victim,null);
    raise exception 'Foreign CV activation accepted';
  exception when others then
    if sqlerrm = 'Foreign CV activation accepted' then raise; end if;
  end;
  begin
    perform public.save_resume_profile(victim,'Foreign CV',null,null,null,null,'','X','[{"name":"Python"}]',null);
    raise exception 'Foreign CV update accepted';
  exception when others then
    if sqlerrm = 'Foreign CV update accepted' then raise; end if;
  end;
  perform public.add_learning_item('Teamwork','','Tinggi','');
  if (select count(*) from public.learning_items) <> 1 then raise exception 'Users share learning keys'; end if;
end;
$$;
rollback;
