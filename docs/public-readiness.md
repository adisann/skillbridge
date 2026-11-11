# Pemeriksaan repositori publik

Aturan matching berada di `web/src/lib/matching-config.ts`. Padanan skill menggunakan satu kamus `web/src/lib/data/skill-aliases.json`, yang dibaca web dan worker. Perusahaan, ID lowongan, identitas akun, dan isi CV tidak digunakan sebagai pengecualian dalam perhitungan produksi. Data contoh pada pengujian hanya untuk regresi.

Konfigurasi rahasia dibaca dari environment. `.env`, kunci privat, dokumen pribadi di root, arsip ZIP, dan hasil pemeriksaan lokal dikecualikan dari Git. `.env.example` berisi placeholder. Jangan memakai prefix `NEXT_PUBLIC_` untuk kredensial layanan; URL dan anon/publishable key Supabase memang merupakan konfigurasi browser, dengan akses data dibatasi RLS.

Notifikasi tugas disimpan per akun dan hanya memuat metadata. Hasil ekstraksi CV serta signed URL unggahan tidak diserialisasi ke penyimpanan notifikasi. Kunci cache pertanyaan memakai SHA-256, bukan potongan pertanyaan asli. Percakapan dengan riwayat tidak memakai cache jawaban pertanyaan tunggal. Analisis CV tetap menggunakan konteks akun dan versi CV. Cache memori dibatasi jumlah entri; pembacaan ulang dari database mengikuti batas yang sama.

Endpoint user menggunakan sesi terverifikasi dan profil milik akun tersebut. Menambah atau mengedit lowongan tidak lagi membaca seluruh CV untuk mengisi tabel skor lama yang tidak dibaca antarmuka. Skor tetap dihitung dengan mesin yang sama saat data ditampilkan. Worker menyamarkan email dan nomor kontak sebelum menyimpan deskripsi. Impor tautan memeriksa protokol, kredensial URL, alamat privat, hasil DNS, dan setiap redirect; pengamanan egress jaringan tetap menjadi tanggung jawab hosting.

## Verifikasi yang dapat diulang

Dari root repositori:

```sh
python scripts/check_public_repo.py
node scripts/check_anonymous_access.mjs
python -m pytest worker/tests -q -p no:cacheprovider
```

Uji SQL terisolasi, tanpa koneksi ke Supabase produksi:

```sh
npm install --prefix worker/.local-checks --no-package-lock --no-save @electric-sql/pglite
node supabase/tests/run-career-learning.mjs
```

Runner tersebut memeriksa signup, isolasi cache antar akun, dan alur CV/rencana belajar. PGlite mengganti kolom vector yang tidak dipakai tes dengan teks; pengujian ini tidak mencakup ekstensi pgvector.

Pemindai kredensial memeriksa source yang tercantum/tidak diabaikan Git, bundle klien `.next/static`, serta objek riwayat pada seluruh branch lokal. Nilai rahasia tidak dicetak. Pola pemindaian dan kecocokan terhadap environment lokal membantu menemukan kebocoran, tetapi tidak membuktikan bahwa semua jenis informasi pribadi telah terdeteksi. Pemeriksaan anonim memakai HEAD dan tidak mengunduh isi CV. Hasil nol tidak membuktikan isolasi antar dua akun; uji RLS pada `supabase/tests` mencakup skenario tersebut dan perlu dijalankan pada database uji.

Dari `web/`:

```sh
npm test
npm run typecheck
npm run lint
npm run dead
npm run dup
npm audit --omit=dev
npm run build
```

Tes HTTP memerlukan server lokal aktif. Tes hak akses admin/non-admin memerlukan `TEST_JURI_EMAIL`, `TEST_JURI_PASSWORD`, `TEST_ADMIN_EMAIL`, dan `TEST_ADMIN_PASSWORD` melalui environment. Tes integrasi yang belum mempunyai server atau akun dilaporkan sebagai dilewati, bukan lulus. Jangan menaruh akun uji asli dalam source.

## Database dan deployment

Terapkan seluruh migrasi, termasuk `20261111000000_private_chat_cache.sql` dan `20261111000001_signup_default_user.sql`, pada lingkungan deployment. Migrasi cache menutup pembacaan langsung seluruh cache jawaban lowongan oleh pengunjung. Server tetap dapat menggunakan cache; pemilik akun tetap hanya bisa membaca analisis CV sendiri. Migrasi signup memastikan pendaftaran selalu membuat pengguna biasa, termasuk bila email atau metadata meminta hak admin. Admin yang sudah ada tidak diubah. Perubahan source lokal tidak otomatis menerapkan migrasi ke Supabase atau menerbitkan deployment.

Pemeriksaan Git hanya mencakup riwayat yang tersedia lokal dan tidak memeriksa pengaturan GitHub, environment hosting, log layanan, atau backup eksternal. Dokumen/arsip lokal yang diabaikan Git tetap berada di komputer pemilik.
