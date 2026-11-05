# Prompt Revisi 6: Bug Scroll Detail, Token Warna yang Hilang, dan Rapikan Tren Skill

Lanjutkan di SkillBridge (`web/`, dev di `localhost:3001`). Revisi 5 sudah di-merge ke `main`. Buat branch `fix/revisi-6` dari `main`, commit per poin, lalu merge lokal `--no-ff` setelah cek di akhir lolos. **Jangan push.** Jangan commit file di `.agents/`.

Aturan kerja: ubah kode dengan tool edit file (bukan PowerShell `-replace` berantai), screenshot pakai `npx --yes playwright@1.48.2 screenshot ... --timeout=30000`, dan jangan jalankan ulang dev server.

---

## 1. Bug scroll panel detail di Job Explorer (`/jobs`, `/lowongan`)

**Gejala:** panel detail di kanan memakai `sticky top-22` (88px) tanpa batas tinggi. Untuk lowongan dengan banyak skill, panelnya lebih tinggi dari layar. Akibatnya:
- Bagian bawah panel tidak bisa dijangkau saat panel menempel di atas.
- Saat mendekati akhir daftar (pagination), panel terdorong ke atas sehingga judul dan cincin skornya terpotong di luar layar.
- Nilai 88px juga tidak masuk akal di halaman berlayout sidebar, karena di sana tidak ada navbar atas.

**Perbaikan:**
- Panel detail: `sticky self-start` dengan `top` sesuai layout (`top-6` di halaman sidebar, dan setinggi navbar + 16px di `/lowongan`). Tambahkan `max-h-[calc(100svh-<top>-24px)] overflow-y-auto overscroll-contain` supaya panel punya scroll sendiri.
- Saat lowongan lain dipilih, scroll panel kembali ke atas (`panelRef.current.scrollTo({ top: 0 })`).
- Header panel (judul, perusahaan, tombol Lamar/Simpan) dibuat `sticky top-0` di dalam panel, dengan latar `--sb-glass-bg-strong`, supaya tetap terlihat saat isi panel di-scroll.
- Scrollbar panel tipis dan tidak mencolok: `scrollbar-width: thin`, warna `--sb-mist`.
- Uji di 1440×900: pilih lowongan dengan 10+ skill, scroll halaman sampai pagination. Judul panel harus selalu terlihat, dan seluruh isi panel bisa dibaca lewat scroll panel.

---

## 2. Token warna lama masih dipakai, tapi sudah tidak ada

Revisi 5 menghapus token `--sb-sky-50` sampai `--sb-sky-600` dan `--sb-ink*` dari `globals.css`, tetapi ratusan class di halaman aplikasi masih memakainya. Class seperti `text-sb-ink-3`, `border-sb-sky-200`, dan `bg-sb-sky-50` sekarang **tidak menghasilkan warna apa pun**, sehingga border hilang dan teks jatuh ke warna default.

File terdampak, dengan jumlah pemakaian terbanyak: `components/tracker/job-comparison-modal.tsx`, `app/dashboard/page.tsx`, `app/cv/page.tsx`, `app/profile/page.tsx`, `app/progress/page.tsx`, `app/admin/page.tsx`, `components/tracker/tracker-table.tsx`, `components/tracker/tracker-header.tsx`, dan `components/jobs/job-chat-assistant.tsx`.

Ganti dengan pemetaan ini. Jangan menambah kembali token lama.

| Lama | Baru |
|---|---|
| `sb-ink` | `sb-text` |
| `sb-ink-2`, `sb-ink-3` | `sb-text-2` |
| `sb-sky-50` | `sb-mist-faint` |
| `sb-sky-100` | `sb-mist-soft` |
| `sb-sky-200` | `sb-mist` (border: `sb-border`) |
| `sb-sky-300`, `sb-sky-400` | `sb-sky` |
| `sb-sky-500`, `sb-sky-600` | `sb-blue` (hanya teks, ikon, garis; jangan dipakai sebagai `bg-`) |

Kerjakan per file. Setelah semua selesai, grep `sb-ink` dan `sb-sky-[0-9]` di `web/src`: hasilnya harus kosong.

---

## 3. Detail lowongan

- Hapus seluruh blok "Sumber data" di detail lowongan (termasuk "Sumber lowongan diambil dari admin_import. Klik 'Buka Detail'…"). Hapus juga semua teks lain di UI yang menyebut asal data atau sumber internal: nama sumber, `sourceName`, `retrievalMethod`, `admin_import`, `jobspy`, waktu crawling, dan sejenisnya, baik di kartu lowongan, panel detail, halaman detail, maupun Tren Skill. Tombol `Lamar di sumber asli` (tautan ke `sourceUrl`) tetap dipertahankan. Grep `sourceName`, `retrievalMethod`, dan `Sumber data` di `web/src/components` dan `web/src/app` untuk menemukan semuanya. Data di API dan database tidak diubah, cukup tidak ditampilkan.
- Label status tidak konsisten. Cincin skor menulis "Perlu bukti", sedangkan badge di sebelahnya "Perlu penguatan skill" untuk lowongan yang sama. Pakai **satu** label dari `matchStatus` yang sama untuk keduanya, ambil dari `lib/copy.ts`. Di bawah angka pada cincin skor, cukup tampilkan label singkat yang sama dengan badge, atau tidak ada label sama sekali.
- Tombol "Buka Detail →": panahnya turun ke baris baru. Tambahkan `whitespace-nowrap` dan `inline-flex items-center gap-1.5`.
- Tombol "Detail Lowongan" di kartu daftar terpotong ("Detail Lowongan" kepotong di kanan). Tambahkan `whitespace-nowrap` dan `shrink-0`. Kalau tetap sempit, ganti labelnya menjadi `Detail`.
- Pagination "Menampilkan 1–10 dari 35 lowongan" pecah menjadi 3 baris. Buat satu baris (`whitespace-nowrap`), lalu taruh pemilih "Per halaman" di baris yang sama atau pindahkan ke kanan.

---

## 4. Tren Skill (`/tren-skill` dan `/insights`)

- Judul tampil tiga kali: banner "Skill yang Paling Dicari", judul kartu "Skill yang Paling Dicari", dan subjudul "Frekuensi Kebutuhan Skill di Pasar". Sisakan judul di banner saja. Hapus judul kartu dan subjudul. Info "Berdasarkan 52 lowongan aktif · diperbarui 4 November 2026" dipindah ke bawah judul banner.
- Versi tamu: tulisan "Masuk untuk membandingkan dengan CV-mu" muncul di **setiap** baris skill. Tampilkan sekali saja, sebagai satu baris ajakan di atas daftar, berisi tombol `Masuk`.
- Bar frekuensi skill masih hijau. Ganti isinya ke `--sb-sky` dengan track `--sb-mist-soft`. Hijau hanya untuk status "ada di CV".

---

## 5. Landing

- Judul hero masih pecah menjadi "sebelum kamu / melamar.". Atur `max-w` judul sekitar `13ch`–`14ch` per baris, atau pisahkan dua baris secara eksplisit (`<span class="block">Tahu skill yang dicari,</span><span class="block">sebelum kamu melamar.</span>`) dengan ukuran font yang muat dalam satu baris di 1280px ke atas. Di mobile boleh terbungkus, tetapi pakai `text-wrap: balance`.

---

## 6. Cek sebelum merge

1. `cd web && npm run lint && npm run build && npm test` lolos semua.
2. Grep `sb-ink`, `sb-sky-[0-9]`, `admin_import`, `Sumber data`, `sourceName`, `retrievalMethod`, dan `Perlu bukti` di JSX `web/src/components` dan `web/src/app`: hasilnya harus kosong, kecuali di `app/admin/` (halaman admin boleh tetap menampilkan sumber).
3. Login demo → `/jobs` → pilih lowongan dengan banyak skill → scroll sampai pagination: judul panel tetap terlihat dan isi panel bisa di-scroll sampai habis.
4. Buka dashboard, CV Saya, Profil, Rencana Belajar, dan Lamaran Saya: semua border dan warna teks tampil (bandingkan dengan screenshot sebelum perbaikan).
5. Screenshot `/jobs` (scroll ke bawah), `/tren-skill`, dashboard, dan profil di 1440px. Simpan di `docs/redesign/revisi-6/`.
