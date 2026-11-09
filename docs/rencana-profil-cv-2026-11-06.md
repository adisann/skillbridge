# Rencana Profil dari CV — SkillBridge

## Status dan batas ruang lingkup

Usulan berdasarkan kode aktual pada commit `0bde8d0`, diperiksa 6 November 2026. Belum disepakati dan belum diimplementasikan. Selesaikan penyimpanan Glints, verifikasi gaji/IPK, dan kejujuran data demo sebelum merombak profil.

Pertahankan rute `/profile`, `/cv`, autentikasi, matching, dan berkas CV lama. Jangan mengganti keseluruhan aplikasi atau mengubah bobot matching untuk menambahkan profil.

## Kondisi aktual

| Bagian | Implementasi sekarang | Implikasi |
|---|---|---|
| `/profile` | Nama/email akun, target bidang/posisi, ringkasan CV aktif, tautan aktivitas, reset demo | Belum memiliki editor riwayat pendidikan/pengalaman atau bagian portofolio |
| Upload CV | `api/cv/upload/route.ts`: unpdf untuk PDF, mammoth untuk DOCX, lalu regex | Belum memakai LLM untuk ekstraksi profil CV |
| Pendidikan | Ada aturan yang menghasilkan `S1 Data Science (Telkom University)` hanya dari frasa gelar; aturan khusus SMK juga ada | Nama institusi/jenjang tidak boleh disimpulkan dari contoh demo |
| Pengalaman | Mengambil angka tahun pertama atau memberi 1 tahun jika ada kata magang | Bukan perhitungan riwayat pengalaman yang dapat dipercaya |
| Skill | Daftar regex dominan data/software; SQL mencakup PostgreSQL | Perlu mempertahankan keterampilan spesifik dan membedakan alias dari relasi skill |
| Nama kandidat | Draf hasil upload; nama pada profile masih berasal dari akun | Jangan menganggap nama CV sudah tersimpan sebagai profil |
| Penyimpanan CV | `resumes`: education, experience_years, gpa, file_url; `parsed_text` diisi ringkasan | Belum ada struktur lengkap pendidikan/pengalaman dan bukti per field |
| LlamaParse | `lib/ai/llamaparse.ts`, dipakai jalur OCR admin melalui extractor | Dapat dipakai ulang sebagai pembaca dokumen, bukan ekstraktor profil siap pakai |
| Persetujuan | Checkbox tersedia pada UI `/cv`; route upload belum memeriksa field persetujuan | Perlu penegakan server sebelum pengiriman CV ke layanan eksternal |
| Privasi file | R2 privat dan signed URL tersedia, tetapi helper upload dapat mengembalikan URL kosong saat gagal; hapus dapat menelan kegagalan R2 | Hindari klaim berhasil menyimpan/menghapus file bila operasi fisik gagal |

Sumber utama: `web/src/app/profile/page.tsx`, `web/src/app/cv/page.tsx`, `web/src/app/api/cv/{upload,save,delete}/route.ts`, `web/src/lib/{r2,candidate-profile}.ts`, `web/src/lib/ai/{extractor,llamaparse}.ts`, dan migrasi awal beserta migrasi gaji/IPK.

## Alur yang diusulkan

```text
Persetujuan baca CV dan pemrosesan eksternal
  → Upload PDF/DOCX
  → Baca teks dokumen
  → Ekstraksi profil terstruktur sebagai draf
  → Review, koreksi, tambah/hapus bagian
  → Simpan hasil yang disetujui
  → Perbarui profil dan input matching
```

PDF dengan teks: gunakan unpdf terlebih dahulu. DOCX: gunakan mammoth. PDF scan atau teks tidak terbaca: gunakan LlamaParse jika tersedia dan disetujui pengguna. Setelah teks tersedia, gunakan Gemini untuk ekstraksi terstruktur dan Groq sebagai fallback jika layanan utama gagal. Nama model tetap berasal dari env. Jangan menganggap model atau endpoint pada kode lama pasti masih didukung tanpa verifikasi saat implementasi.

Jika pembaca dokumen gagal, tampilkan error berkas. Jika LLM gagal, pertahankan teks yang berhasil dibaca dan tawarkan pengisian manual; jangan membuat profil hasil tebakan. Jangan mengubah bytes PDF/DOCX menjadi UTF-8 lalu menganggapnya teks CV yang berhasil dibaca.

## Bagian profil

| Bagian | Isi yang dapat dikoreksi | Aturan |
|---|---|---|
| Data diri | Nama, headline, lokasi umum, kontak opsional | Email login tetap dikelola lewat autentikasi; jangan mengambil NIK, agama, atau data sensitif yang tidak diperlukan |
| Tentang saya | Ringkasan dari CV | Nyatakan sebagai draf; jangan menambahkan pencapaian baru |
| Pendidikan | Institusi, program studi, jenjang, periode, IPK/skala | Institusi dan gelar harus ada buktinya; IPK bukan skala 4 tidak dikonversi dengan tebakan |
| Pengalaman | Perusahaan, posisi, jenis pengalaman, tanggal, tanggung jawab | Magang bukan otomatis satu tahun; periode tumpang tindih tidak dihitung ganda |
| Skill | Nama skill dan cuplikan bukti | Skill manual tetap berstatus klaim mandiri; PostgreSQL tidak identik dengan SQL |
| Portofolio | Judul, deskripsi, tautan | Ambil hanya jika ditemukan; validasi protokol URL dan hindari HTML mentah |
| Penghargaan | Nama, penerbit, tahun, deskripsi | Kosong bila tidak ditemukan |
| Organisasi | Organisasi, jabatan, periode, kontribusi | Jangan digabung otomatis dengan pengalaman kerja |
| Preferensi kerja | Bidang/posisi, lokasi, mode kerja, kontrak, gaji opsional | Isi dari CV hanya bila eksplisit; selebihnya pilihan pengguna |

Setiap field yang diekstrak memiliki cuplikan bukti singkat yang dapat dibaca pada review. Jangan menampilkan angka keyakinan yang seolah-olah terkalibrasi. Nilai yang tidak ditemukan berupa null atau daftar kosong; gunakan label “Belum ditemukan”, bukan nilai pendidikan/pengalaman default.

## Penyimpanan yang diusulkan

Pertahankan `profiles` untuk identitas akun dan preferensi target yang sudah dipakai. Tambahkan satu tabel profil kandidat privat, satu baris per pengguna, dengan `user_id` UUID sebagai primary key sekaligus foreign key ke `profiles.id` dan penghapusan mengikuti akun. Struktur detail yang selalu dibaca/disimpan sebagai satu dokumen dapat memakai JSONB untuk pendidikan, pengalaman, portofolio, penghargaan, dan organisasi. Tentukan bentuk objek tetap pada TypeScript dan validasi server; jangan menjadikannya payload bebas tanpa kontrak.

Data ringkasan untuk matching tetap menggunakan kolom dan relasi yang sudah ada di `resumes`/`resume_skills`. Simpan hanya setelah pengguna menyetujui draf. Simpan sumber resume dan waktu pembaruan agar profil tidak tercampur ketika CV diganti. Untuk MVP, draf berada di state form; belum perlu tabel versi draf, registry, atau riwayat eksperimen. Beri peringatan sebelum pengguna meninggalkan draf yang belum disimpan.

Nilai pengalaman yang belum diketahui harus dapat dibedakan dari pengalaman nol tahun. Skema saat ini memakai `experience_years NOT NULL DEFAULT 0`, dan loader kandidat memberi pendidikan default Sarjana. Saat tahap ini diimplementasikan, sesuaikan nullability serta loader/matching secara bersamaan agar nilai tidak diketahui tetap netral; jangan sekadar mengganti label UI.

Aktifkan RLS pada tabel baru. Akses profil kandidat dibatasi ke pemilik melalui `auth.uid()` pada read/write, dengan validasi kepemilikan resume di server. Primary key `user_id` sudah menyediakan indeks untuk akses per pemilik; tidak perlu indeks JSONB sebelum ada query nyata yang memerlukannya. Tidak membuka profil ke pengguna lain atau admin secara default. Tidak menggunakan service-role key pada client.

Penyimpanan profil dan ringkasan matching harus konsisten: gunakan operasi database atomik saat implementasi, lalu hitung ulang hasil turunan setelah simpan berhasil. Kegagalan tidak boleh menghapus skill lama dan meninggalkan profil setengah tersimpan.

Ini desain usulan, bukan migrasi yang siap dijalankan. Baca aturan Supabase dan panduan Next.js terpasang sebelum implementasi dan susun migrasi setelah ruang lingkup disepakati.

## Tahap implementasi yang disarankan

1. **Perbaikan ekstraksi dan dasar profil:** hapus asumsi institusi demo dan pengalaman magang; terapkan kontrak draf/bukti/null, persetujuan server, alur unpdf/mammoth → LlamaParse bila diperlukan → Gemini/Groq. Pertahankan review sebelum simpan.
2. **Profil inti:** editor data diri, tentang saya, pendidikan, pengalaman, skill, dan preferensi; integrasikan `/cv` sebagai pintu upload dan `/profile` sebagai hasil yang bisa diedit. Satu tombol Simpan dengan status proses yang jelas.
3. **Bagian pelengkap:** portofolio, penghargaan, dan organisasi memakai pola tambah/edit/hapus yang sama. Bagian kosong boleh dilewati agar alur demo tetap singkat.
4. **Privasi dan verifikasi demo:** pastikan hapus CV beserta ekstraksi/cache/file benar-benar selesai, reset akun demo tidak memengaruhi pengguna lain, serta pengujian mobile 375px dan desktop 1440px.

Usulan untuk tenggat demo: sepakati tahap 1–2 sebagai prioritas, lalu tahap 3 bila alur inti stabil. Jika seluruh bagian wajib pada demo ini, konfirmasikan cakupan itu sebelum implementasi agar tidak menyisakan editor setengah jadi.

## Kriteria selesai

- PDF teks, DOCX, dan PDF scan menghasilkan draf yang dapat ditinjau, atau error yang jujur.
- Institusi, pengalaman, skill, dan IPK tidak diisi berdasarkan contoh demo atau tebakan.
- CV pengganti tidak menimpa profil tersimpan sebelum konfirmasi pengguna.
- Pengguna dapat memperbaiki, menghapus, menambah, menyimpan, dan membuka kembali bagian profil.
- Field tanpa bukti tetap kosong dan tidak menurunkan skor matching sebagai nilai nol.
- Hanya pemilik yang dapat membaca/mengubah profil dan CV; UI tidak menyebut skill manual terverifikasi.
- Tidak ada teks CV, signed URL, token, atau key pada log/laporan.
- Penghapusan tidak menyatakan semua data hilang jika file atau database gagal dihapus.
- Alur inti diuji dengan dua CV demo dan satu PDF scan, navigasi keyboard, serta ukuran layar demo; build, lint, dan tes yang relevan lulus.
