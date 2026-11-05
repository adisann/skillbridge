-- Nama akun demo cukup "Budi Pratama" (tanpa embel-embel "Juri Lomba").
UPDATE public.profiles
SET full_name = 'Budi Pratama'
WHERE email IN ('juri@skillbridge.demo', 'juri@skillbridge.id');

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{full_name}', '"Budi Pratama"')
WHERE email IN ('juri@skillbridge.demo', 'juri@skillbridge.id');
