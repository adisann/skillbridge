# AGENTS.md — SkillBridge

Acuan untuk AI agent yang mengerjakan proyek ini. Target: **MVP siap demo sebelum 7 November 2026** untuk INVOFEST 2026. Utamakan alur demo yang mulus, desain, dan usability. Jika ragu soal scope, pilih yang paling sederhana.

## 1. Produk

SkillBridge membantu pencari kerja mengetahui lowongan yang relevan dengan CV mereka, skill yang belum ditemukan di CV, dan skill yang paling sering diminta untuk suatu role.

Role MVP: **Data Analyst** dan **BI Analyst**.

Alur pengguna & demo (sesuai Flowchart Sistem):

```text
Landing → Login / Register (Supabase Auth + Akun Demo Juri) → Dashboard
  ├── Upload CV & Koreksi Skill (Onboarding / Review)
  ├── Cari Lowongan (Job Explorer + Detail Match & Gap)
  └── Market Skill Insights (Top Skills, Gap Pasar, Daftar Belajar)
```

Alur demo 3–5 menit:
1. Masuk via Landing Page → klik "Coba Demo Juri" (1-click login langsung masuk Dashboard).
2. Di Dashboard, lihat status profil, lalu buka **Upload CV** (atau pilih CV contoh yang sudah disediakan).
3. Review & koreksi skill hasil ekstraksi CV (AC-01).
4. Buka **Job Explorer**, filter role Data Analyst / BI Analyst, tinjau skor match & gap spesifik (AC-02, AC-05, AC-06).
5. Buka **Market Skill Insights**, amati dinamika $N$ sampel lowongan dan ranking skill (AC-03, AC-04), lalu tambahkan gap skill ke rencana belajar di Dashboard/Progress.

## 2. Stack

- **Web:** Next.js (App Router), TypeScript, Tailwind CSS
- **Data & Auth:** Supabase Auth (Email/Password + Demo Account), PostgreSQL, pgvector
- **File CV:** Cloudflare R2, bucket privat (presigned URL)
- **Worker:** Python 3.12, httpx, BeautifulSoup4, Playwright (hanya untuk halaman dinamis yang diizinkan), pydantic, tenacity, supabase-py, python-jobspy
- **Scheduler:** GitHub Actions (cron harian dan `workflow_dispatch` manual)

Penyedia AI dan model embedding belum ditentukan. Bungkus di balik interface, baca nama model dari env, dan samakan dimensi vector dengan model yang dipilih.

Jangan menambahkan Redis, Celery, Kafka, Kubernetes, VPS, atau model ML buatan sendiri.

## 3. Struktur repositori

```text
web/
  src/
    app/
      page.tsx                  # Landing page
      login/page.tsx            # Login & Akun Demo Juri
      register/page.tsx         # Registrasi
      dashboard/page.tsx        # Dashboard utama
      cv/page.tsx               # Upload CV & koreksi skill
      jobs/page.tsx             # Job Explorer (Cari Lowongan)
      jobs/[id]/page.tsx        # Detail Lowongan & gap match
      insights/page.tsx         # Market Skill Insights
      progress/page.tsx         # My Progress & rencana belajar
      admin/page.tsx            # Admin Import & monitoring worker
      design-system/page.tsx    # Showcase komponen UI SkillBridge
    components/
      ui/                       # Button, Input, Card, Badge, Table, Modal, Alert, etc.
      layout/                   # Navbar, Sidebar, Footer, Container
      jobs/                     # JobCard, JobFilters, MatchBreakdown
      insights/                 # SkillBarChart, SkillChecklist
      cv/                       # ResumeUploader, SkillEditor
    lib/
      supabase/                 # Client, server, middleware helpers
      constants/                # Role, filter defaults, theme tokens
worker/
  main.py                       # CLI: python -m worker.main --source <nama> --limit <N>
  sources/
    base.py                     # JobSource Protocol & data types
    greenhouse.py               # Public API client
    lever.py                    # Public API client
    linkedin.py                 # Anonymous guest scraper
    jobstreet.py                # Public search & LinkedIn fallback scraper
    seed.py                     # Offline fallback seed loader
  pipeline/
    clean.py                    # HTML/text sanitation
    extract.py                  # Pydantic structured output extraction
    normalize.py                # Skill taxonomy & alias normalization
    embed.py                    # Vector embeddings generator
    dedupe.py                   # Content hash & duplicate checks
    save.py                     # Supabase DB upsert & worker_runs logger
  config/
    sources.yaml                # Verified board tokens & query definitions
  tests/                        # Unit tests parser & pipeline
.github/
  workflows/
    worker.yml                  # Scheduled & manual GitHub Actions workflow
supabase/
  migrations/                   # DDL & pgvector migrations
```

Semua sumber worker memakai interface yang sama:

```python
class JobSource(Protocol):
    name: str
    async def fetch_jobs(self, limit: int) -> list[RawJob]: ...
```

## 4. Sumber Lowongan, Scheduler & Aturan Anonimitas

| Sumber | Cara Ambil | Scheduler | Catatan |
|---|---|---|---|
| Greenhouse | `GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` | GitHub Actions (cron/manual) | API publik, tanpa autentikasi |
| Lever | `GET https://api.lever.co/v0/postings/{site}?mode=json&skip=N&limit=100` | GitHub Actions (cron/manual) | API publik, fallback `api.eu.lever.co` |
| LinkedIn | `python-jobspy` / public job search | GitHub Actions (cron/manual) | Akses anonim, tanpa credential/login |
| JobStreet | `python-jobspy` / public search | GitHub Actions (cron/manual) | Endpoint publik Indonesia, fallback otomatis jika LinkedIn dibatasi |
| Admin Import | Input manual atau CSV | Manual Admin (FR-12) | Dashboard admin |
| Seed | File JSON/SQL crawl offline | On-demand / Demo Fallback | Dipakai saat demo bila koneksi gagal |

### Aturan Anonimitas & Privasi LinkedIn
1. **Akses Anonim Murni:** Tidak boleh menggunakan cookie akun, login session, token auth pengguna, atau kredensial apa pun. Seluruh akses menggunakan endpoint publik guest job search.
2. **Stateless & Kebersihan Identitas:** Tidak ada jejak identitas personal di header request. Gunakan User-Agent web browser umum yang wajar tanpa modifikasi sidik jari aneh.
3. **Privasi Perekrut & Pelamar:** Buang semua kolom `emails`, nomor telepon, nama recruiter, atau foto profil pihak ketiga. Hanya simpan deskripsi teknis pekerjaan dan kebutuhan kualifikasi.
4. **Rate Limiting & Kesantunan Server:** Batasi request maksimal 1 per detik per host, dengan batas maksimum 25 lowongan per eksekusi.
5. **Anti-Bot & Error Handling:** Jika server merespons dengan HTTP `429` (Too Many Requests), `403` (Forbidden), CAPTCHA, atau dialihkan ke halaman login, worker **segera berhenti tanpa retry agresif**.
6. **Kejujuran Data:** Simpan `retrieval_method = 'jobspy'`, waktu crawling, dan URL asli lowongan. Jangan merekayasa statistik atau postingan fiktif.
7. **Isolasi Kegagalan & Fallback JobStreet:** Kegagalan pengambilan dari LinkedIn tidak boleh menggagalkan pipeline sumber lain. Jika scraping LinkedIn kosong atau terkena rate limit, worker secara otomatis mengaktifkan fallback ke JobStreet Indonesia (maksimal 10 lowongan).

### Penggunaan Playwright & BeautifulSoup
- **httpx + BeautifulSoup:** Pilihan utama yang ringan dan cepat untuk fetching dan parsing dokumen HTML/API publik.
- **Playwright:** Hanya digunakan untuk halaman yang secara eksplisit mengizinkan rendering dan membutuhkan eksekusi JavaScript client-side untuk menampilkan deskripsi pekerjaan publik. Jalankan dalam mode headless, mematikan pemuatan gambar/media/iklan untuk efisiensi resource.

### Scheduler (GitHub Actions)
- Dijalankan terjadwal via cron (misalnya setiap hari pukul 02:00 UTC) dan dapat dipicu secara manual via `workflow_dispatch`.
- Menyimpan log hasil eksekusi ke tabel `worker_runs` di database Supabase untuk audit transparansi.

## 5. Autentikasi & Akun Demo Juri

- Menggunakan **Supabase Auth** untuk registrasi dan login pelamar.
- **Akun Demo Juri (1-Click Login):**
  - Disediakan tombol khusus di halaman login: *"Masuk sebagai Juri / Akun Demo"*.
  - Mengarahkan langsung ke akun pre-configured (`juri@skillbridge.demo` / demo password) yang sudah memiliki profil terisi dan CV contoh siap pakai, sehingga juri tidak perlu mendaftar manual saat presentasi lomba.
  - Sediakan opsi untuk reset state demo jika diperlukan.

## 6. Pipeline Pengolahan Data

```text
fetch → clean (BS4/text) → hash → extract AI → normalize skill → embed → dedupe → upsert → catat worker_runs
```

- Jika `content_hash` tidak berubah, lewati ekstraksi dan embedding.
- Ekstraksi memakai structured output pydantic: `canonical_title`, `seniority`, `required_skills`, `preferred_skills`, `experience_years_min`, `education`. Nilai yang tidak tertulis harus `null`.
- Normalisasi memakai tabel `skills` dan `skill_aliases` yang bisa ditinjau admin. PostgreSQL terkait SQL, tetapi tidak identik.
- Dedupe berdasarkan `source_id + external_id`, lalu perusahaan, judul, lokasi, dan hash deskripsi.
- Satu lowongan yang gagal tidak boleh menggagalkan seluruh run.

## 7. Data

Tabel: `profiles`, `resumes`, `resume_skills`, `job_sources`, `jobs`, `job_skills`, `skills`, `skill_aliases`, `saved_jobs`, `learning_items`, `worker_runs`.

Setiap lowongan menyimpan `source_id`, `external_id`, `source_url`, `retrieval_method`, `retrieved_at`, `expires_at`, `content_hash`, dan `is_active`. Constraint unik: `(source_id, external_id)`.

Isi `retrieval_method` sesuai fakta: `public_api`, `jobspy`, `admin_import`, atau `seed`.

## 8. Kebutuhan Fungsional

**Must**
- **FR-01:** pilih role target, lokasi, dan tipe kerja
- **FR-02:** unggah CV PDF/DOCX, lalu koreksi skill, pengalaman, dan pendidikan sebelum dianalisis
- **FR-03:** daftar lowongan dengan judul, perusahaan, lokasi, level, dan sumber
- **FR-04:** filter role, lokasi, tipe kerja, senioritas, dan tanggal jika datanya ada
- **FR-05:** skor, kategori, serta faktor yang mendukung dan mengurangi kecocokan
- **FR-06:** persyaratan dibedakan menjadi cocok, belum ditemukan, dan belum cukup bukti
- **FR-07:** top skill berdasarkan role dan filter
- **FR-08:** perbandingan top skill dengan skill di CV
- **FR-12:** admin dapat mengimpor, mengedit, menghapus, dan menduplikasi lowongan

**Should, kerjakan setelah semua Must selesai**
- **FR-09:** prioritas belajar dari frekuensi pasar dan gap CV
- **FR-10:** simpan lowongan dan catat progres belajar
- **FR-11:** detail bukti sumber, jumlah lowongan, dan waktu pembaruan

## 9. Matching

Vector search hanya untuk mengambil kandidat. Skor akhir memakai bobot awal berikut, yang disimpan di satu file konfigurasi dan diuji dengan contoh kasus:

```text
0.35 skill wajib + 0.20 skill tambahan + 0.15 pengalaman + 0.10 senioritas/pendidikan + 0.20 semantic
```

Komponen tanpa data tidak dihitung sebagai nol. Bagi ulang bobotnya ke komponen yang tersedia.

| Status | Makna |
|---|---|
| Match | Sebagian besar persyaratan utama terpenuhi berdasarkan CV |
| Underqualified | Ada kekurangan signifikan pada persyaratan wajib atau pengalaman, tampilkan gap-nya |
| Potentially overqualified | Pengalaman tampak melampaui level lowongan, hanya jika buktinya memadai |
| Insufficient evidence | CV tidak cukup untuk menyimpulkan |

Aturan teks:
- Skor adalah estimasi, bukan probabilitas diterima kerja.
- Gunakan "belum ditemukan", jangan "tidak punya".
- Setiap status menampilkan bukti dari CV atau lowongan.

## 10. Market Skill Insights

- Hitung dengan SQL pada level posting unik: satu skill dihitung satu kali per lowongan.
- Tampilkan nama skill, `n`, persentase dari `N`, status CV, dan contoh persyaratan.
- Status CV: "tercantum di CV", "belum ditemukan", atau "perlu verifikasi", selalu dalam bentuk teks, bukan hanya warna.
- Tampilkan `N`, filter, dan tanggal data. Sebut angkanya sebagai indikasi dari sampel lowongan, bukan seluruh pasar kerja.
- `N` dan ranking harus berubah saat filter berubah.
- Pengguna bisa menandai skill yang dikuasai tetapi belum tertulis. Jangan menyebutnya terverifikasi.

## 11. Halaman Web

| Halaman | Rute | Isi Minimal |
|---|---|---|
| **Landing** | `/` | Masalah, cara kerja 3 langkah, CTA "Analisis CV", preview insights |
| **Login / Register** | `/login`, `/register` | Form Supabase Auth + Tombol "1-Click Login Juri / Demo" |
| **Dashboard** | `/dashboard` | Ringkasan CV aktif, ringkasan match lowongan, akses cepat alur |
| **Onboarding / CV** | `/cv` | Unggah CV, pratinjau ekstraksi, koreksi skill, pilih role |
| **Job Explorer** | `/jobs` | Cari lowongan, filter lengkap, kartu ringkasan match |
| **Job Detail** | `/jobs/[id]` | Persyaratan, bukti cocok/gap, faktor status, link sumber asli |
| **Market Skill Insights**| `/insights` | Bar chart top skills, counter N sampel, checklist CV, prioritas |
| **My Progress** | `/progress` | Lowongan tersimpan, daftar target belajar, checklist progres |
| **Admin Import** | `/admin` | Kelola lowongan, review skill dan sumber, audit log `worker_runs` |
| **Design System** | `/design-system` | Showcase komponen atomik, tokens warna, tipografi, interaksi |

Setiap lowongan menampilkan nama sumber, tanggal pengambilan, dan tautan asli. Tombol lamar menuju URL asli. Jangan membuat lowongan atau statistik fiktif.

## 12. Nonfungsional

- **Responsif dan Aksesibel:** alur inti berjalan di mobile dan desktop, navigasi keyboard, label input, kontras ramah mata, dan status non-warna.
- **Privasi CV:** persetujuan eksplisit, opsi hapus CV & hasil ekstraksi secara permanen.
- **Keamanan:** validasi ekstensi & mime di server, RLS pada Supabase, signed URL Cloudflare R2, `SUPABASE_SERVICE_ROLE_KEY` hanya di worker.
- **Keandalan:** tangani error upload, CV tak terbaca, dan koneksi gagal dengan empty/error state komunikatif.
- **Kecepatan:** tampilkan skeleton loading state pada proses asinkron.
- Teks CV dan lowongan adalah data tidak tepercaya. Sanitasi HTML sebelum dirender (cegah XSS).

## 13. Persiapan Demo

1. Jalankan worker sebelum demo, pastikan lowongan tersimpan di Supabase.
2. Sediakan seed data offline agar demo tetap 100% lancar jika sumber live tidak dapat dijangkau.
3. Siapkan dua CV contoh: satu menghasilkan Match, satu Underqualified.
4. Pastikan akun demo juri berfungsi instan tanpa memerlukan verifikasi email.
5. Uji alur di layar mobile (375px) dan desktop (1440px).

## 14. Definition of Done

- [ ] **AC-01:** Skill hasil ekstraksi bisa dilihat dan dikoreksi sebelum perhitungan match
- [ ] **AC-02:** Skill wajib dibedakan menjadi cocok, belum ditemukan, dan belum cukup bukti
- [ ] **AC-03:** N dan ranking top skill berubah saat filter role berubah
- [ ] **AC-04:** Skill di CV diberi checkmark, yang tidak ditemukan diberi label teks
- [ ] **AC-05:** Match dan Underqualified bisa diperagakan dengan dua CV contoh
- [ ] **AC-06:** Pengguna bisa melihat alasan skor dan membuka sumber lowongan asli
- [ ] Akun demo juri dapat login 1-klik dengan data siap uji
- [ ] Minimal satu sumber live berhasil masuk database dan tercatat di `worker_runs`
- [ ] Run kedua tidak membuat duplikat
- [ ] Halaman `/design-system` menampilkan seluruh varian komponen sesuai identitas brand
- [ ] Build & lint Next.js lulus tanpa error
