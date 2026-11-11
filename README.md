# SkillBridge

SkillBridge membantu pencari kerja membandingkan isi CV dengan persyaratan lowongan, melihat skill yang sering diminta, dan membuat rencana belajar dari skill yang belum tercantum.

## Alur demo

Mulai dari [demo SkillBridge](https://skillbridge-three-chi.vercel.app/).

1. Buka **Lowongan** atau **Tren Skill** untuk melihat katalog dan kebutuhan skill tanpa masuk.
2. Masuk dengan akun pelamar yang dibagikan tim secara terpisah. Buka **CV Saya** untuk meninjau CV aktif dan target karier.
3. Di **Lowongan**, buka detail posisi untuk melihat persyaratan, bukti kecocokan dari CV, dan deskripsi pekerjaan.
4. Tambahkan skill dari **Tren Skill** ke **Rencana Belajar**. Lowongan yang disimpan dapat ditinjau di **Lamaran Saya**.

## Menjalankan secara lokal

Gunakan Node.js 24 untuk aplikasi web dan Python 3.12 untuk worker. Buat `web/.env.local` dari [`web/.env.example`](web/.env.example). Gunakan proyek Supabase yang sudah menerapkan [migrasi](supabase/migrations), bucket Cloudflare R2 privat untuk CV, serta konfigurasi penyedia AI untuk asisten lowongan dan impor lowongan dari tautan atau poster. Pembacaan CV berjalan tanpa AI.

```sh
cd web
npm ci
npm run dev
```

Buka [localhost:3000](http://localhost:3000). Untuk memeriksa aplikasi, jalankan `npm test`, `npm run lint`, `npm run typecheck`, dan `npm run build` dari direktori `web`.

Aturan skor, alternatif skill, level bahasa, dan normalisasi padanan dijelaskan di [perhitungan kecocokan](docs/matching.md). Pemeriksaan privasi, kode tak terpakai, duplikasi, serta kebutuhan migrasi deployment tersedia di [pemeriksaan repositori publik](docs/public-readiness.md).

Pada instalasi Supabase baru, buat akun pelamar untuk demo melalui Supabase Auth dan unggah CV sintetis. Akun seed hanya untuk data contoh dan memakai kata sandi acak. Simpan konfigurasi lokal di `web/.env.local` dan konfigurasi deployment di pengaturan layanan hosting.

## Struktur repositori

- [`web/`](web/) memuat aplikasi Next.js untuk pengunjung, pelamar, dan admin.
- [`worker/`](worker/) memuat pengambilan dan pemrosesan lowongan. Dari root, pasang dependensi dengan `python -m pip install -r worker/requirements.txt` lalu jalankan `python -m pytest worker/tests`.
- [`supabase/`](supabase/) memuat migrasi dan pengujian kebijakan akses data.
- [`docs/`](docs/) memuat kebutuhan produk, aturan kecocokan, dan [diagram sistem](docs/diagrams/) (PNG serta sumber Draw.io).
