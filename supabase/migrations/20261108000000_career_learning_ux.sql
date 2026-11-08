begin;

create function public.skill_name_key(value text) returns text
language sql immutable strict set search_path = '' as $$
  select lower(regexp_replace(btrim(value), '\s+', ' ', 'g'));
$$;

create function public.canonical_learning_key(value text) returns text
language sql stable security invoker set search_path = '' as $$
  select coalesce(
    (select public.skill_name_key(s.name) from public.skills s
      where public.skill_name_key(s.name) = public.skill_name_key(value) order by s.id limit 1),
    (select public.skill_name_key(s.name) from public.skill_aliases a join public.skills s on s.id = a.skill_id
      where public.skill_name_key(a.alias) = public.skill_name_key(value) order by a.id limit 1),
    public.skill_name_key(value));
$$;

alter table public.learning_items
  add column notes text not null default '',
  add column source_job_id uuid references public.jobs(id) on delete set null,
  add column skill_key text,
  add column duplicate_of uuid references public.learning_items(id) on delete set null;

update public.learning_items set skill_key = public.canonical_learning_key(skill_name);
-- Preserve every historical row, including conflicting notes/progress/priority.
with ranked as (
  select id, first_value(id) over (partition by user_id, skill_key order by created_at, id) as first_id
  from public.learning_items
)
update public.learning_items l set duplicate_of = r.first_id
from ranked r where l.id = r.id and r.id <> r.first_id;
alter table public.learning_items alter column skill_key set not null;
create unique index learning_items_user_skill_unique on public.learning_items(user_id, skill_key)
  where duplicate_of is null;

create function public.prepare_learning_item() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.duplicate_of := null;
    new.skill_name := regexp_replace(btrim(new.skill_name), '\s+', ' ', 'g');
    new.skill_key := public.canonical_learning_key(new.skill_name);
  else
    if new.skill_name is distinct from old.skill_name or new.skill_key is distinct from old.skill_key
      or new.duplicate_of is distinct from old.duplicate_of or new.user_id is distinct from old.user_id then
      raise exception 'Identitas target belajar tidak dapat diubah';
    end if;
  end if;
  if new.skill_key = '' then raise exception 'Nama skill wajib diisi'; end if;
  return new;
end;
$$;
create trigger prepare_learning_item before insert or update on public.learning_items
for each row execute function public.prepare_learning_item();

create function public.add_learning_item(p_skill_name text, p_reason text, p_priority text, p_resource text, p_job_id uuid default null)
returns public.learning_items language plpgsql security invoker set search_path = '' as $$
declare result public.learning_items; key text;
begin
  if auth.uid() is null then raise exception 'Tidak terautentikasi'; end if;
  if p_priority not in ('Tinggi', 'Sedang', 'Rendah') then raise exception 'Prioritas tidak valid'; end if;
  key := public.canonical_learning_key(p_skill_name);
  insert into public.learning_items(user_id, skill_name, reason, priority, resource_suggestion, source_job_id, skill_key)
  values(auth.uid(), p_skill_name, p_reason, p_priority, p_resource, p_job_id, key)
  on conflict (user_id, skill_key) where duplicate_of is null do nothing returning * into result;
  if result.id is null then
    select * into result from public.learning_items
      where user_id = auth.uid() and skill_key = key and duplicate_of is null;
  end if;
  return result;
end;
$$;
revoke all on function public.add_learning_item(text,text,text,text,uuid) from public, anon;
grant execute on function public.add_learning_item(text,text,text,text,uuid) to authenticated;

alter table public.profiles add column target_roles text[] not null default '{}';
update public.profiles set target_roles = array[target_role] where nullif(btrim(target_role), '') is not null;
alter table public.resumes alter column experience_years type numeric using experience_years::numeric;
alter table public.resumes alter column experience_years drop not null;
alter table public.resumes alter column experience_years drop default;
alter table public.resumes add column experience_target_role text;
alter table public.resumes add constraint resumes_experience_nonnegative check (experience_years >= 0);
alter table public.resume_skills add column needs_review boolean not null default false;
-- Fails safely if an installation already has multiple active CVs; resolve explicitly first.
create unique index resumes_one_active_per_user on public.resumes(user_id) where is_active;

create function public.set_career_context(p_resume_id uuid default null, p_target_role text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare target text;
begin
  if auth.uid() is null then raise exception 'Tidak terautentikasi'; end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  if p_resume_id is not null then
    if not exists(select 1 from public.resumes where id = p_resume_id and user_id = auth.uid()) then
      raise exception 'CV tidak ditemukan';
    end if;
    update public.resumes set is_active = false where user_id = auth.uid() and is_active;
    update public.resumes set is_active = true where id = p_resume_id and user_id = auth.uid();
  end if;
  target := regexp_replace(btrim(p_target_role), '\s+', ' ', 'g');
  if target is not null and target <> '' then
    update public.profiles set target_role = target,
      target_roles = case when target = any(target_roles) then target_roles else array_append(target_roles, target) end
      where id = auth.uid();
  end if;
end;
$$;
revoke all on function public.set_career_context(uuid,text) from public, anon;
grant execute on function public.set_career_context(uuid,text) to authenticated;

-- One transaction for CV, skill corrections, and activation. Taxonomy insertion is
-- narrowly scoped here because ordinary users cannot write the shared taxonomy.
create function public.save_resume_profile(p_resume_id uuid, p_filename text, p_file_url text,
  p_education text, p_gpa numeric, p_years numeric, p_summary text, p_target text, p_skills jsonb, p_experience_target text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare rid uuid; sid uuid; item jsonb; v_name text; actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Tidak terautentikasi'; end if;
  perform 1 from public.profiles where id = actor for update;
  if p_file_url is not null and (p_file_url not like 'r2://resumes/' || actor::text || '/%'
    or p_file_url like '%..%' or position(chr(92) in p_file_url) > 0) then
    raise exception 'Berkas CV bukan milik akun ini';
  end if;
  if p_years < 0 or p_years > 81 then raise exception 'Durasi tidak valid'; end if;
  if jsonb_array_length(p_skills) = 0 then raise exception 'Tambahkan minimal satu skill'; end if;
  if p_resume_id is not null and not exists(select 1 from public.resumes where id = p_resume_id and user_id = actor) then
    raise exception 'CV tidak ditemukan';
  end if;
  update public.resumes set is_active = false where user_id = actor and is_active;
  if p_resume_id is null then
    insert into public.resumes(user_id, filename, file_url, education, gpa, experience_years, experience_target_role, parsed_text, is_active)
    values(actor, p_filename, p_file_url, p_education, p_gpa, p_years, p_experience_target, p_summary, true) returning id into rid;
  else
    rid := p_resume_id;
    update public.resumes set filename = p_filename, file_url = coalesce(p_file_url, file_url), education = p_education,
      gpa = p_gpa, experience_years = p_years, experience_target_role = p_experience_target, parsed_text = p_summary, is_active = true,
      updated_at = now() where id = rid and user_id = actor;
  end if;
  delete from public.resume_skills where resume_id = rid;
  for item in select * from jsonb_array_elements(p_skills) loop
    v_name := regexp_replace(btrim(item->>'name'), '\s+', ' ', 'g');
    if v_name is null or v_name = '' then raise exception 'Nama skill wajib diisi'; end if;
    select s.id into sid from public.skills s where public.skill_name_key(s.name) = public.canonical_learning_key(v_name) order by s.id limit 1;
    if sid is null then
      insert into public.skills(name, category) values(v_name, 'Umum & Terkait')
      on conflict (name) do update set name = excluded.name returning id into sid;
    end if;
    insert into public.resume_skills(resume_id, skill_id, is_claimed_by_user, needs_review, evidence)
    values(rid, sid, coalesce((item->>'claimed')::boolean, false), coalesce((item->>'needsReview')::boolean, false), nullif(item->>'evidence',''))
    on conflict (resume_id, skill_id) do update set is_claimed_by_user = excluded.is_claimed_by_user,
      needs_review = excluded.needs_review, evidence = excluded.evidence;
  end loop;
  perform public.set_career_context(rid, p_target);
  return rid;
end;
$$;
revoke all on function public.save_resume_profile(uuid,text,text,text,numeric,numeric,text,text,jsonb,text) from public, anon;
grant execute on function public.save_resume_profile(uuid,text,text,text,numeric,numeric,text,text,jsonb,text) to authenticated;

create function public.claim_resume_skill(p_skill_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare rid uuid; sid uuid; v_name text; actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Tidak terautentikasi'; end if;
  perform 1 from public.profiles where id = actor for update;
  select id into rid from public.resumes where user_id = actor and is_active;
  if rid is null then raise exception 'Unggah dan simpan CV terlebih dahulu'; end if;
  v_name := regexp_replace(btrim(p_skill_name), '\s+', ' ', 'g');
  if v_name is null or v_name = '' or length(v_name) > 200 then raise exception 'Nama skill tidak valid'; end if;
  select s.id into sid from public.skills s where public.skill_name_key(s.name) = public.canonical_learning_key(v_name) order by s.id limit 1;
  if sid is null then
    insert into public.skills(name, category) values(v_name, 'Umum & Terkait')
      on conflict (name) do update set name = excluded.name returning id into sid;
  end if;
  insert into public.resume_skills(resume_id, skill_id, is_claimed_by_user, evidence)
    values(rid, sid, true, null) on conflict (resume_id, skill_id) do nothing;
  update public.resumes set updated_at = now() where id = rid;
end;
$$;
revoke all on function public.claim_resume_skill(text) from public, anon;
grant execute on function public.claim_resume_skill(text) to authenticated;

commit;
