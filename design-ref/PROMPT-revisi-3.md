# Prompt Revisi 3: Demo Juri, Navbar, dan Rapikan Copy

Kamu melanjutkan pekerjaan di SkillBridge (`web/`, Next.js 16, Tailwind v4, dev di `localhost:3001`). Revisi 2 (landing publik, palet biru langit, multi-bidang) sudah di-merge ke `main`. Baca `AGENTS.md` dulu. Deadline 7 November 2026.

Buat branch `fix/revisi-3` dari `main`, commit kecil per poin, lalu merge lokal `--no-ff` ke `main` setelah cek di akhir lolos. **Jangan push.**

`git status` saat ini menampilkan banyak file di `.agents/skills/` sebagai modified. Itu hanya perbedaan line ending, jadi **jangan di-commit**. Commit hanya file di `web/` dan `docs/`.

---

## 1. PRIORITAS TERTINGGI: akun demo juri tidak punya CV

Login lewat "Coba akun demo" (`juri@skillbridge.id`) sekarang masuk ke dashboard berstatus "Belum ada CV", dan semua lowongan menampilkan "Belum ada skor". Alur demo juri jadi rusak, padahal `AGENTS.md` mensyaratkan akun demo sudah punya CV contoh siap pakai.

- Di `app/api/auth/demo/route.ts`, setelah login berhasil, pastikan akun demo **selalu** punya CV contoh. Jika `resumes` atau `resume_skills` milik akun demo kosong, isi ulang dari data seed di `supabase/migrations/20261103000002_seed_demo_and_jobs.sql`. Proses ini harus idempoten, jadi tidak boleh menduplikasi data.
- Di halaman Profil, khusus akun demo, tambahkan tombol "Reset akun demo". Tombol ini mengembalikan CV contoh, mengosongkan tracker, dan mengosongkan rencana belajar.
- Uji: logout → "Coba akun demo" → dashboard menampilkan skill dari CV, dan `/jobs` langsung menampilkan skor tanpa reload.

---

## 2. Navbar landing

Saat ini navbar landing berisi dropdown "Menu Aplikasi", dua tombol "Buka Dashboard", avatar, dan tombol "Keluar". Latarnya selalu putih 82% tanpa `backdrop-filter`, sehingga teks hero terbaca tembus di belakangnya.

- **Isi navbar:** Logo · `Lowongan` (/jobs) · `Tren Skill` (/insights) di kiri. Di kanan: `Masuk` (ghost) dan `Mulai gratis` (primary sky-400, teks `--sb-ink`). Jika sudah login, ganti keduanya dengan satu tombol `Buka Dashboard` dan avatar kecil. Hapus dropdown "Menu Aplikasi" dan tombol "Keluar" dari navbar landing, karena logout cukup ada di sidebar aplikasi.
- **Transparan di puncak halaman:**
  - Navbar memakai `position: fixed`, dan hero diberi `padding-top` setinggi navbar (72px) supaya gradien hero terlihat di belakang navbar.
  - Deteksi scroll memakai sentinel `IntersectionObserver` 8px di paling atas halaman, bukan scroll listener.
  - Di puncak halaman: latar transparan, tanpa border dan shadow, tinggi 72px.
  - Setelah scroll: `bg-white/88`, `backdrop-filter: blur(20px) saturate(150%)`, border-bottom `var(--sb-glass-border)`, shadow `0 4px 16px -8px rgba(14,165,233,0.15)`, tinggi 64px. Transisi 200ms.
  - Saat menu mobile terbuka, navbar selalu solid. Menu mobile dibuka sebagai sheet dari kanan dengan latar putih solid.
  - Teks di belakang navbar tidak boleh terbaca saat kondisi scroll.
- Navbar di halaman aplikasi tidak diubah.

---

## 3. Hapus eyebrow dan subjudul pengisi

Hapus semua eyebrow (teks kecil atau pill dengan ikon di atas judul) di seluruh halaman, termasuk landing. Judul halaman dan section harus bisa berdiri sendiri tanpa label tambahan.

Hapus juga subjudul section yang hanya mengulang judul:

| File | Hapus |
|---|---|
| `app/page.tsx` | "Tiga langkah sederhana untuk mengetahui persiapan kerjamu." |
| `app/page.tsx` | "Dibuat untuk memudahkan langkah pertama pencarian kerjamu." |
| `app/page.tsx` | "Informasi praktis seputar penggunaan SkillBridge." |
| `app/page.tsx` (kartu hero) | label "Contoh skill yang sering diminta:" (chip skill sudah cukup jelas) |
| `app/page.tsx` (kartu hero) | label "Aktif" di setiap kartu bidang (tidak punya arti) |

Copy lain di landing:
- Judul FAQ "Pertanyaan yang Sering Diajukan" → `Pertanyaan umum`. Rata kiri, sama seperti judul section lain.
- Judul hero di 1440px pecah menjadi "sebelum kamu / melamar." Lebarkan `max-width` judul (sekitar 14ch per baris) atau pakai `text-wrap: balance`, supaya baris kedua tetap utuh "sebelum kamu melamar.".

---

## 4. Dashboard

- **Kartu "Skill di CV-mu":** saat CV belum ada, kalimat ajakan muncul dua kali ("Unggah dokumen CV-mu untuk melihat…" dan "Belum ada CV. Unggah CV untuk…"). Sisakan satu kalimat saja: `Belum ada CV. Unggah untuk melihat skill yang terbaca.`, ditambah tombol `Unggah CV`.
- Label "SKILL YANG PALING DICARI:" → `Skill paling dicari` (sentence case, tanpa titik dua).
- **Kartu "Rencana Belajar"** sekarang menampilkan skill teratas pasar, bukan rencana milik pengguna, padahal isinya sudah sama dengan kartu statistik pasar di atasnya.
  - Jika pengguna punya CV: tampilkan maksimal 3 skill yang diminta lowongan di bidangnya tetapi belum ada di CV, dengan judul `Skill yang belum ada di CV-mu`.
  - Jika belum punya CV: sembunyikan kartu ini.
  - Rencana belajar milik pengguna sendiri tetap ada di halaman `/progress`.

---

## 5. Job Explorer

- Default filter "Bidang" masih "Semua Bidang". Untuk pengguna yang login, default-nya adalah bidang target pengguna (akun demo: Data & Analitik), dengan teks kecil `Menampilkan bidang Data & Analitik · Ubah` di atas daftar. Untuk pengunjung yang belum login, default tetap "Semua Bidang".
- Query `?bidang=<slug>` dari landing selalu menang atas default.

---

## 6. Detail kecil

- Label berukuran `text-[10px]` (di profil, tracker, dan lainnya) dinaikkan minimal ke `text-xs` (12px) supaya tetap terbaca.
- `aria-label` cincin skor: "Skor estimasi kecocokan X%" → `Skor kecocokan X%`.
- `job-comparison-modal.tsx`: "Tinjau kesesuaian kualifikasi, prioritas minat, dan estimasi kompensasi secara berdampingan" → `Bandingkan lowongan secara berdampingan.`

---

## 7. Cek sebelum merge

1. `cd web && npm run lint && npm run build && npm test` lolos semua.
2. Logout → "Coba akun demo" → dashboard menampilkan skill dari CV, dan `/jobs` langsung menampilkan skor serta default bidang Data & Analitik.
3. Landing di puncak: navbar transparan dan gradien hero mengalir sampai ke tepi atas. Setelah scroll: kaca blur, dan teks di belakangnya tidak terbaca.
4. Grep di `app/` dan `components/`: tidak ada `Menu Aplikasi` di navbar landing, tidak ada `text-[10px]`, dan tidak ada subjudul yang disebut di bagian 3.
5. Screenshot landing (puncak dan setelah scroll), dashboard, dan Job Explorer di 1440px dan 375px. Simpan di `docs/redesign/revisi-3/`.

Laporkan daftar commit dan hal yang kamu putuskan sendiri.
