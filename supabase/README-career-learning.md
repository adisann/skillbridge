# Migrasi CV, target karier, dan rencana belajar

Perubahan aplikasi membutuhkan `migrations/20261108000000_career_learning_ux.sql`, setelah migrasi sebelumnya termasuk gaji/IPK. Pastikan migrasi telah diterapkan melalui proses migrasi Supabase proyek sebelum memakai versi aplikasi ini. Seluruh perubahan SQL berada dalam satu transaksi.

Migrasi menambah catatan dan referensi lowongan, identitas skill belajar, daftar target karier, penanda skill yang belum ditinjau, serta fungsi penyimpanan dan aktivasi CV. `experience_years` menjadi `numeric` nullable: 6 bulan = 0,5 tahun; 15 bulan = 1,25 tahun; nol berbeda dari belum diisi. Nilai tahun lama tetap dipertahankan. Pengalaman bertanda target lain tidak digunakan sebagai pengalaman relevan pada target aktif.

Periksa terlebih dahulu apakah instalasi memiliki beberapa CV aktif per akun:

```sql
select user_id, array_agg(id order by updated_at desc) as active_resume_ids
from public.resumes
where is_active
group by user_id
having count(*) > 1;
```

Jika ada hasil, tentukan CV aktif yang benar untuk setiap akun sebelum menerapkan migrasi. Indeks satu CV aktif akan menolak kondisi ambigu; migrasi tidak memilih atau menghapus CV lama secara otomatis.

Duplikasi belajar lama tetap tersimpan, termasuk alasan, sumber materi, progres, dan prioritas setiap baris. `duplicate_of` menandai baris tambahan untuk peninjauan di UI. Baris paling awal menjadi acuan penambahan berikutnya; tidak ada penggabungan catatan atau progres. Pengguna meninjau dan menyalin informasi yang diperlukan sebelum menghapus baris duplikat. Target utama baru dapat dihapus setelah duplikatnya dihapus.

Penambahan baru memakai normalisasi kapitalisasi/spasi dan taksonomi/alias kanonis. SQL dan PostgreSQL tetap berbeda. Indeks unik dan RPC `INSERT ... ON CONFLICT DO NOTHING` menangani benturan penambahan tanpa menimpa pilihan pengguna. Label prioritas lama `Menengah` dan `Dasar` ditampilkan sebagai `Sedang` dan `Rendah`, berdasarkan urutan pilihan pada form prioritas lama; nilai historis tidak dimigrasikan. Perubahan eksplisit pengguna menyimpan label baru.

Fungsi CV yang memakai `security definer` memeriksa `auth.uid()`, kepemilikan CV, dan awalan objek privat. Fungsi tersebut hanya dapat dipanggil akun terautentikasi. Tabel yang sudah ada tetap memakai RLS; tidak ada akses lintas akun yang ditambahkan. Kecocokan lowongan, simpanan, dan chat membaca CV/target aktif. Hasil kecocokan dihitung saat dibaca, sehingga pergantian konteks tidak bergantung pada cache match historis.

## Pengujian lokal

Dari root repositori, pasang PGlite hanya sebagai alat uji sementara (bukan dependensi aplikasi), lalu jalankan:

```powershell
npm install --prefix .tmp-ux-checks --no-package-lock --no-save @electric-sql/pglite
node supabase/tests/run-career-learning.mjs
```

Runner membuat database sementara dalam memori dan fixture dua akun. Skema awal, RLS, dan migrasi di atas benar-benar dieksekusi. Ekstensi dan kolom vector yang tidak terkait diganti dengan kolom teks untuk runner ini. Uji mencakup data lama, alias, penyimpanan catatan, pergantian CV/target, durasi bulan, rollback, penolakan CV milik akun lain, lowongan tersimpan, dan 20 pemanggilan tambah paralel. PGlite menserialisasi eksekusi; uji ini bukan pengujian transaksi bersamaan melalui beberapa koneksi PostgreSQL native.

Pengujian browser menggunakan hasil build aplikasi dan API fixture lokal terisolasi pada viewport 375px dan 1440px. Interaksi ini memeriksa React/UI, bukan integrasi Supabase Auth, PostgREST, unggahan R2, atau parser dokumen live. Integrasi tersebut perlu diuji pada staging setelah migrasi diterapkan. Tidak ada deployment maupun mutasi produksi dalam pekerjaan ini.
