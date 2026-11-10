-- Audit 10 Nov 2026: tandai lowongan contoh yang identitasnya tidak cocok dengan URL sumber
-- (mis. "PT Nusantara FinTech" menaut ke lowongan Cloudflare London) atau memakai URL placeholder.
-- Tidak menghapus baris apa pun; hanya mengubah retrieval_method menjadi 'seed' supaya jujur.
-- Aplikasi web sudah menyaring entri ini dari katalog publik lewat web/src/lib/demo-jobs.ts,
-- jadi migrasi ini menyelaraskan data di database.
--
-- Untuk membatalkan: jalankan bagian ROLLBACK di bawah.

update public.jobs
set retrieval_method = 'seed'
where retrieval_method <> 'seed'
  and (
    external_id in ('gh-40112', 'li-412988102', 'lev-88a2e1', 'gh-8109620', 'li-4478504092-seed', 'lev-5f40e053-seed')
    or external_id like 'seed-%'
    or id::text like '33333333-0000-0000-0000-%'
  );

-- ROLLBACK (manual, bila diperlukan):
-- update public.jobs set retrieval_method = 'public_api' where external_id in ('gh-40112', 'lev-88a2e1', 'gh-8109620', 'lev-5f40e053-seed');
-- update public.jobs set retrieval_method = 'jobspy' where external_id in ('li-412988102', 'li-4478504092-seed');
