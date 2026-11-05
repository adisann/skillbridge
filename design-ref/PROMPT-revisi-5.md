# Prompt Revisi 5: Halaman Publik untuk Tamu, Palet Baru, dan Animasi Hero

Kamu melanjutkan pekerjaan di SkillBridge (`web/`, Next.js 16 App Router, Tailwind v4, dev di `localhost:3001`). Baca `AGENTS.md` dulu. Deadline 7 November 2026.

Kalau prompt revisi 3 (`design-ref/PROMPT-revisi-3.md`) atau revisi 4 (hapus strip sumber dan FAQ, perbaiki `sb-sky-700`) belum dijalankan, kerjakan keduanya dulu, lalu lanjutkan ke prompt ini.

Buat branch `feat/revisi-5` dari `main`, commit kecil per bagian, lalu merge lokal `--no-ff` setelah cek di bagian 6 lolos. **Jangan push.** Jangan commit file di `.agents/` (hanya beda line ending).

Aturan kerja:
- Ubah kode dengan tool edit file, bukan PowerShell `-replace` berantai.
- Screenshot memakai `npx --yes playwright@1.48.2 screenshot --viewport-size=1440,900 --wait-for-timeout=3000 --timeout=30000 <url> <file>`.
- Dev server sudah berjalan. Jangan dijalankan ulang dan jangan ditunggu.

---

## 1. Pisahkan halaman publik (tamu) dan halaman aplikasi (login)

**Prinsip:** halaman yang memakai sidebar hanya untuk pengguna yang sudah login. Tamu mendapat halaman versi publik dengan isi yang sama, memakai navbar dan footer landing, tanpa sidebar.

### Rute

| Untuk | Rute | Layout | Akses |
|---|---|---|---|
| Tamu | `/lowongan`, `/lowongan/[id]` | Navbar + footer landing | Publik |
| Tamu | `/tren-skill` | Navbar + footer landing | Publik |
| Login | `/jobs`, `/jobs/[id]` | Sidebar aplikasi | Wajib login |
| Login | `/insights` | Sidebar aplikasi | Wajib login |

- Tambahkan `/jobs`, `/jobs/:path*`, dan `/insights` ke daftar rute terproteksi di `middleware.ts`. Tamu yang membuka rute itu di-redirect ke versi publiknya: `/jobs?bidang=x` → `/lowongan?bidang=x`, `/jobs/[id]` → `/lowongan/[id]`, `/insights` → `/tren-skill`. Query string tetap dibawa.
- Pengguna login yang membuka `/lowongan`, `/lowongan/[id]`, atau `/tren-skill` di-redirect ke versi aplikasinya, dengan query string tetap dibawa.
- Perbarui semua tautan publik:
  - Navbar landing: `Lowongan` → `/lowongan`, `Tren Skill` → `/tren-skill`.
  - Kartu bidang di landing → `/lowongan?bidang=<slug>`.
  - Tombol "Lihat lowongan" di hero → `/lowongan`.
- Buat route group supaya layout tidak bercampur, misalnya `app/(public)/lowongan/...`, `app/(public)/tren-skill/...`, dan `app/(app)/jobs/...`. Pastikan URL tidak berubah.

### Jangan menduplikasi kode

Ekstrak isi halaman yang sudah ada menjadi komponen bersama dengan prop `mode: "guest" | "user"`:
- `components/jobs/job-explorer.tsx`: daftar, filter, dan master–detail
- `components/jobs/job-detail.tsx`: detail lowongan
- `components/insights/skill-trends.tsx`: tren skill

Halaman di `(public)` dan `(app)` cukup merender komponen yang sama dengan mode berbeda.

### Perbedaan mode `guest`

- **Tidak ada** cincin skor, tulisan "Belum ada skor", status kecocokan, maupun rincian skor. Untuk tamu, elemen-elemen ini kosong dan tidak berguna. Sebagai gantinya, kartu lowongan menampilkan 3–4 chip skill yang diminta (dari `requiredSkills`).
- Tombol header "Koreksi CV" dan "Lihat Tren Skill" diganti satu tautan biasa: `Tren skill di bidang ini` → `/tren-skill?bidang=<slug>`.
- Tombol simpan (ikon bookmark) tetap tampil. Saat diklik, tamu diarahkan ke `/login?next=<url sekarang>`.
- Detail lowongan untuk tamu berisi: judul, perusahaan, lokasi, tipe, tenggat, skill wajib dan tambahan (chip), deskripsi asli, tombol `Lamar di sumber asli`, dan satu kartu ajakan `Masuk untuk melihat skill mana yang sudah ada di CV-mu` dengan tombol `Masuk` dan `Coba akun demo`.
- Asisten chat AI tidak ditampilkan untuk tamu, supaya token tetap hemat.
- Di Tren Skill versi tamu, sembunyikan semua status "di CV" dan tombol "Saya kuasai" / "Target belajar".
- Pakai API yang sama (`/api/jobs`, `/api/insights`). Respons tanpa sesi sudah tidak membawa skor.
- Tambahkan `metadata` (title dan description) untuk ketiga halaman publik.

---

## 2. Palet warna baru

Palet ini menggantikan seluruh palet biru langit sebelumnya. **Abu-abu tidak dipakai sama sekali**, termasuk untuk teks sekunder. Warna yang boleh: empat biru di bawah, putih, hitam (jarang), dan warna status.

```css
:root {
  /* Palet utama */
  --sb-navy:  #1B365D;  /* judul & teks utama, ikon kuat — BUKAN latar */
  --sb-blue:  #005A9C;  /* aksen teks, link, ikon, status aktif, ring fokus — BUKAN latar */
  --sb-sky:   #60C1E5;  /* latar tombol primary, bar grafik, cincin skor, kotak piksel */
  --sb-mist:  #A0E0EF;  /* chip, border aktif, orb latar, track grafik */

  /* Turunan (boleh sebagai latar) */
  --sb-sky-hover:  #7FCDEA;                    /* hover tombol primary */
  --sb-mist-soft:  rgba(160, 224, 239, 0.28);  /* latar section, chip lembut */
  --sb-mist-faint: rgba(160, 224, 239, 0.14);  /* latar halaman di atas putih */
  --sb-border:     rgba(0, 90, 156, 0.14);     /* border kartu & divider */

  /* Teks */
  --sb-text:   var(--sb-navy);                 /* teks utama */
  --sb-text-2: rgba(27, 54, 93, 0.72);         /* teks sekunder: navy transparan, kontras ±5:1, BUKAN abu */

  --sb-white: #FFFFFF;
  --sb-black: #0A0A0A;                          /* opsional, sangat jarang */

  /* Kaca */
  --sb-glass-bg:        rgba(255, 255, 255, 0.66);
  --sb-glass-bg-strong: rgba(255, 255, 255, 0.86);
  --sb-glass-shadow:    0 1px 2px rgba(27, 54, 93, 0.05), 0 18px 48px -16px rgba(0, 90, 156, 0.18);

  /* Status */
  --sb-good:     #15803D;
  --sb-warning:  #B45309;
  --sb-critical: #B91C1C;
}
```

### Aturan pemakaian

- **`#1B365D` dan `#005A9C` tidak boleh menjadi warna latar**, baik section, banner, tombol, kartu, maupun badge. Keduanya hanya untuk teks, ikon, garis, dan ring fokus.
- **Judul hero:** baris pertama `--sb-navy`, baris kedua ("sebelum kamu melamar.") `--sb-blue`, menggantikan abu yang sekarang.
- **Teks:** judul dan body memakai `--sb-text`. Teks sekunder, caption, label, dan placeholder memakai `--sb-text-2`. Ganti semua `--sb-ink`, `--sb-ink-2`, `--sb-ink-3`, `zinc-*`, `slate-*`, `gray-*`, dan `neutral-*`.
- **Tombol primary:** latar `--sb-sky`, teks `--sb-navy` (kontras ±6:1), hover `--sb-sky-hover`. Jangan memakai teks putih di atas `--sb-sky`.
- **Tombol secondary:** latar putih, border `--sb-border`, teks `--sb-navy`, hover latar `--sb-mist-soft`.
- **Link:** teks `--sb-blue`, underline saat hover.
- **Chip dan badge netral** (misalnya level "Mid", nama perusahaan): latar `--sb-mist-soft`, teks `--sb-navy`. Chip "Belum ada skor" yang abu di halaman aplikasi juga ikut diganti ke gaya ini.
- **Grafik:** isi bar dan cincin skor `--sb-sky`, track `--sb-mist-soft`. Status cocok, kurang, atau tidak ada tetap memakai hijau/amber/merah.
- **Latar halaman:** putih dengan orb `--sb-mist` (opacity 0.35–0.5, blur besar). Banner judul halaman memakai gradien `--sb-mist-soft` → putih.
- **Navbar:** border bawah sekarang terlihat sebagai garis hitam 1px. Ganti ke `--sb-border`.
- **Logo:** kotak gradien `--sb-sky` → `--sb-mist` dengan ikon kompas `--sb-navy`. Wordmark "Skill" `--sb-navy`, "Bridge" `--sb-blue`. Perbarui juga file SVG di `public/` dan `app/icon.svg`.
- Perbarui `app/design-system/page.tsx` supaya menampilkan palet ini dengan nama dan aturan pemakaiannya.

Hapus token lama `--sb-sky-50` sampai `--sb-sky-600` dan `--sb-ink*`, lalu ganti semua pemakaiannya. Tidak boleh ada token lama yang masih dirujuk.

---

## 3. Animasi hero landing

### a. Kartu mengambang

Kartu-kartu di kanan hero (Data & Analitik, Software Engineering, chip skill, Produk & Desain) bergerak naik-turun pelan, seperti mengambang.

```css
@keyframes sb-float {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%      { transform: translate3d(0, var(--float-y, -10px), 0) rotate(var(--float-r, 0.4deg)); }
}
.sb-float {
  animation: sb-float var(--float-dur, 6s) ease-in-out infinite;
  animation-delay: var(--float-delay, 0s);
  will-change: transform;
}
```

- Setiap kartu punya ritme sendiri supaya tidak bergerak serempak. Contoh:
  - Kartu 1: `--float-y:-10px; --float-dur:6s; --float-delay:0s`
  - Kartu 2: `-8px; 7s; -1.5s`
  - Kartu 3: `-12px; 6.5s; -3s; --float-r:-0.4deg`
  - Kartu 4: `-9px; 7.5s; -4.5s`
- Animasi float dipasang pada elemen **dalam**, sedangkan parallax scroll tetap di elemen **pembungkus**. Dengan begitu, dua `transform` tidak saling menimpa.
- Kartu yang bergerak tidak boleh memakai `backdrop-filter`. Pakai latar `--sb-glass-bg-strong` solid.

### b. Kotak piksel naik seperti panah, lalu berulang

Kotak-kotak biru kecil di latar hero disusun membentuk **panah ke atas** (chevron plus batang). Panah ini bergerak naik perlahan, memudar di atas, lalu muncul lagi dari bawah dan berulang terus.

- Bungkus semua kotak dalam satu grup `.sb-arrow`, lalu animasikan grup itu:

```css
@keyframes sb-rise {
  0%   { transform: translate3d(0, 60px, 0);   opacity: 0; }
  15%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translate3d(0, -140px, 0); opacity: 0; }
}
.sb-arrow { animation: sb-rise 7s linear infinite; }
```

- Supaya terasa hidup, setiap kotak juga berkedip halus (opacity 0.5 → 1 → 0.5, durasi 2.4s). Delay-nya bertahap per baris, dari bawah ke atas (`--i * 120ms`), sehingga terlihat seperti cahaya yang merambat naik di dalam panah.
- Opsional: dua panah bergantian. Panah kedua di kolom berbeda dengan `animation-delay: -3.5s`, jadi selalu ada satu panah yang sedang naik.
- Warna kotak memakai `--sb-sky` dan `--sb-mist`, dengan opacity 0.6–0.9. Pasang `aria-hidden="true"`.
- Pakai `transform` dan `opacity` saja.

### c. Aturan performa dan aksesibilitas

- `prefers-reduced-motion: reduce`: semua animasi float, rise, dan kedip mati. Kartu dan panah tampil diam di posisi akhirnya.
- Hentikan animasi saat hero tidak terlihat: gunakan `IntersectionObserver` yang mengatur `animation-play-state: paused` pada hero.
- Di layar < 768px, amplitudo float dikurangi setengahnya, cukup satu panah, dan jumlah kotak dikurangi.
- Scroll harus tetap mulus di 60fps dan CLS < 0.1.

---

## 4. Hal lain yang terlihat di screenshot

- Navbar landing belum transparan di puncak halaman. Ikuti spesifikasi di revisi 3 bagian 2: transparan di puncak, kaca blur setelah scroll.
- Ruang kosong di bawah tombol hero cukup besar. Rapikan supaya tinggi hero kira-kira `min(100svh, 760px)` dan section berikutnya mulai terlihat sedikit di bagian bawah layar. Ini memberi isyarat bahwa halaman masih bisa di-scroll.

---

## 5. Jangan diubah

Rumus di `lib/matching*`, auth, worker, dan isi API (kecuali menambah dukungan mode tamu kalau memang perlu).

---

## 6. Cek sebelum merge

1. `cd web && npm run lint && npm run build && npm test` lolos semua.
2. **Tamu (logout):**
   - `/lowongan` dan `/tren-skill` terbuka tanpa sidebar, tanpa skor, dan tanpa "Belum ada skor".
   - Membuka `/jobs` atau `/insights` otomatis di-redirect ke versi publiknya.
   - Klik bookmark → diarahkan ke `/login?next=…`.
3. **Login demo:**
   - `/lowongan?bidang=data-analitik` di-redirect ke `/jobs?bidang=data-analitik` dengan skor tampil.
   - Klik kartu bidang di landing → masuk ke halaman yang sesuai status login.
4. **Warna:** grep di `web/src` untuk `zinc-`, `slate-`, `gray-`, `neutral-`, `--sb-ink`, `--sb-sky-`, `#71717A`, `#52525B`, dan `#18181B`. Hasilnya harus kosong. Grep juga `bg-[#1B365D]`, `bg-[#005A9C]`, `bg-sb-navy`, dan `bg-sb-blue`, yang juga harus kosong.
5. **Kontras:** teks tombol primary dan `--sb-text-2` di atas putih minimal 4.5:1. Cek dengan DevTools.
6. **Animasi:** kartu mengambang tidak serempak, panah piksel naik lalu berulang dari bawah, animasi berhenti saat `prefers-reduced-motion` diaktifkan, dan animasi berhenti (pause) saat hero tidak terlihat.
7. Screenshot `/`, `/lowongan`, `/lowongan/[id]`, `/tren-skill`, dan `/jobs` (login) di 1440px dan 375px. Simpan di `docs/redesign/revisi-5/`.

Laporkan daftar commit dan keputusan yang kamu ambil sendiri.
