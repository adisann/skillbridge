-- Run against an isolated test database after all migrations, never a live demo.
begin;
do $$
declare
  test_id uuid := gen_random_uuid();
begin
  -- Both the historical special address and client-controlled metadata are untrusted.
  insert into auth.users(id, email, raw_user_meta_data)
    values(test_id, 'admin@skillbridge.demo', '{"role":"admin","full_name":"Signup fixture"}');
  if (select role from public.profiles where id = test_id) is distinct from 'user' then
    raise exception 'Signup elevated an untrusted user';
  end if;
end;
$$;
rollback;
