# SkillBridge

SkillBridge membantu pencari kerja membandingkan isi CV dengan persyaratan lowongan, melihat skill yang sering diminta, dan membuat rencana belajar dari skill yang belum tercantum.

## Alur demo

1. Buka **Lowongan** atau **Tren Skill** untuk melihat katalog dan kebutuhan skill tanpa masuk.
2. Masuk dengan akun pelamar yang diberikan panitia atau tim. Buka **CV Saya** untuk meninjau CV aktif dan target karier.
3. Di **Lowongan**, buka detail posisi untuk melihat persyaratan, bukti kecocokan dari CV, dan deskripsi pekerjaan.
4. Tambahkan skill dari **Tren Skill** ke **Rencana Belajar**. Lowongan yang disimpan dapat ditinjau di **Lamaran Saya**.

## Menjalankan secara lokal

Gunakan Node.js 24 untuk aplikasi web dan Python 3.12 untuk worker. Buat `web/.env.local` dari [`web/.env.example`](web/.env.example). Gunakan proyek Supabase yang sudah menerapkan [migrasi](supabase/migrations), bucket Cloudflare R2 privat untuk CV, serta konfigurasi penyedia AI untuk ekstraksi CV dan asisten lowongan.

```sh
cd web
npm ci
npm run dev
```

Buka [localhost:3000](http://localhost:3000). Untuk memeriksa aplikasi, jalankan `npm test`, `npm run lint`, dan `npm run build` dari direktori `web`.

## Struktur repositori

- [`web/`](web/) memuat aplikasi Next.js untuk pengunjung, pelamar, dan admin.
- [`worker/`](worker/) memuat pengambilan dan pemrosesan lowongan. Dari root, pasang dependensi dengan `python -m pip install -r worker/requirements.txt` lalu jalankan `python -m pytest worker/tests`.
- [`supabase/`](supabase/) memuat migrasi dan pengujian kebijakan akses data.
- [`docs/`](docs/) memuat diagram alur dan kebutuhan produk.
