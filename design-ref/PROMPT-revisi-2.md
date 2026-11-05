# Prompt Revisi 2: Landing Publik, Palet Biru Langit, Multi-Bidang, dan Perbaikan Pasca-Redesign

Kamu adalah senior UI engineer, product designer, dan UX writer untuk SkillBridge (Next.js 16 App Router, React 19, Tailwind v4) di folder `web/`. Dev server berjalan di `localhost:3001`. Baca `AGENTS.md` di root dan `web/AGENTS.md` sebelum mulai. Deadline lomba 7 November 2026, jadi utamakan hasil yang stabil.

Redesign glassmorphism sebelumnya sudah di-merge ke `main`. Revisi ini punya empat tujuan:

1. Landing page bersih dari data personal, skor, maupun kecocokan, sehingga bisa dilihat siapa saja.
2. Tidak ada warna biru gelap. Biru paling tua yang boleh dipakai adalah biru langit.
3. Target kerja mencakup banyak bidang, tidak cuma Data Analyst dan BI Analyst.
4. Perbaikan bug yang ditemukan setelah redesign.

Logika pencocokan, API, auth, dan worker hanya diubah di poin yang disebut secara eksplisit di bawah.

---

## 0. Alur git

1. Jalankan `git status`. Kalau ada perubahan yang belum di-commit, commit dulu dengan pesan `chore: commit pending newline changes` (ada beberapa file yang hanya berubah newline). Jangan stash atau reset.
2. Buat branch dari `main`: `git switch -c fix/public-landing-sky-palette`.
3. Commit kecil per bagian, dengan format conventional commit.
4. Setelah semua cek di bagian 8 lolos, merge lokal ke `main` dengan `--no-ff`. **Jangan push.**

---

## 1. Palet: biru langit, tanpa biru gelap

**Aturan utama:** di seluruh aplikasi tidak boleh ada biru yang lebih gelap dari `sky-500` (`#0EA5E9`). Navy, royal blue, indigo, dan `blue-600` ke atas dilarang. `sky-600` (`#0284C7`) hanya boleh untuk ikon, ring fokus, dan garis tipis, bukan untuk latar atau teks body.

Teks memakai netral gelap yang **tidak kebiruan**, supaya kontras tetap aman walaupun palet birunya terang.

Ganti seluruh token di `web/src/app/globals.css`:

```css
:root {
  /* Biru langit (satu-satunya keluarga biru) */
  --sb-sky-50:  #F0F9FF;   /* latar halaman */
  --sb-sky-100: #E0F2FE;   /* latar section, chip */
  --sb-sky-200: #BAE6FD;   /* border aktif, bar grafik latar */
  --sb-sky-300: #7DD3FC;   /* hover tombol primary, orb */
  --sb-sky-400: #38BDF8;   /* tombol primary, bar grafik, aksen */
  --sb-sky-500: #0EA5E9;   /* batas tergelap untuk elemen besar */
  --sb-sky-600: #0284C7;   /* HANYA ikon, ring fokus, garis 1px */

  /* Teks netral (bukan slate/navy) */
  --sb-ink:   #18181B;     /* judul, teks utama, tombol gelap */
  --sb-ink-2: #52525B;     /* teks sekunder */
  --sb-ink-3: #71717A;     /* placeholder, caption (tidak untuk body) */

  /* Kaca */
  --sb-glass-bg:        rgba(255, 255, 255, 0.62);
  --sb-glass-bg-strong: rgba(255, 255, 255, 0.82);
  --sb-glass-border:    rgba(14, 165, 233, 0.16);
  --sb-glass-shadow:    0 1px 2px rgba(24, 24, 27, 0.04), 0 18px 48px -14px rgba(14, 165, 233, 0.18);
  --sb-glass-blur:      18px;

  /* Status (bukan biru) */
  --sb-good:     #15803D;
  --sb-warning:  #B45309;
  --sb-critical: #B91C1C;
}
```

Aturan pemakaian:

| Elemen | Sebelumnya | Sekarang |
|---|---|---|
| Latar halaman | biru-putih + orb biru | `--sb-sky-50` + 2–3 orb `--sb-sky-200`/`--sb-sky-300` (opacity 0.3–0.5, blur besar) |
| `.page-hero` / banner judul halaman | gradien navy → royal blue, teks putih | **Dihapus.** Ganti dengan `.page-banner`: gradien `--sb-sky-100` → `--sb-sky-50` → putih, border `--sb-glass-border`, teks `--sb-ink` |
| Section "gelap" di landing | navy | Latar `--sb-sky-100` dengan motif piksel `--sb-sky-300` |
| Tombol primary | gradien biru tua, teks putih | Latar `--sb-sky-400`, **teks `--sb-ink`** (kontras ±8:1), hover `--sb-sky-300` |
| Tombol CTA kuat (opsional) | — | Latar `--sb-ink`, teks putih (gaya together.ai) |
| Tombol secondary | kaca + border biru | Kaca + border `--sb-sky-200`, teks `--sb-ink` |
| Link | biru tua | Teks `--sb-ink` dengan underline `--sb-sky-400` (2px, offset 3px) |
| Logo | gradien biru tua | Kotak gradien `--sb-sky-400` → `--sb-sky-300`, ikon kompas putih, ring `white/50`. Wordmark "Skill" `--sb-ink`, "Bridge" `--sb-sky-500` |
| Bar grafik / cincin skor | biru tua | Isi `--sb-sky-400`, track `--sb-sky-100` (status cocok/kurang tetap hijau/amber/merah) |
| Ring fokus | biru | 2px `--sb-sky-600`, offset 2px |

Hapus kelas dan token lama: `--sb-blue-*`, `--sb-navy-*`, `.bg-royal-gradient`, `.page-hero`, serta warna Tailwind `blue-*`, `indigo-*`, `slate-9**`, `navy`, dan hex lama (`#2556E8`, `#1B42C4`, `#172033`, `#253B62`, `#161A2B`) di `web/src`. Perbarui juga `web/public/logo.svg`, `logo-mark.svg`, `favicon.svg`, dan `app/icon.svg` ke palet baru.

Semua teks body wajib minimal kontras 4.5:1. Jangan pernah meletakkan teks putih di atas `--sb-sky-300` atau `--sb-sky-400`.

---

## 2. Landing page publik: konten baru

### Aturan konten (wajib)

Landing page adalah halaman untuk publik. **Jangan tampilkan apa pun yang baru bisa didapat setelah login atau upload CV:**

- Tidak ada skor, persentase kecocokan, cincin skor, "similarity", "match", "kesiapan CV", atau label status kecocokan.
- Tidak ada mockup berisi data orang (nama file CV, nama pengguna, skill seseorang, "Rekomendasi untukmu").
- Tidak ada angka statistik yang dibuat-buat. Kalau ingin menampilkan angka, ambil dari data publik yang asli (misalnya jumlah lowongan aktif per bidang), atau jangan tampilkan angka sama sekali.
- Tombol header berubah sesuai sesi ("Buka Dashboard" jika sudah login), tapi **isi landing tetap sama untuk semua orang**. Hapus teks seperti "Budi" di header landing; cukup avatar kecil.

**Kata dan frasa yang dilarang** di landing, dan sebaiknya juga di seluruh UI: transparan/transparansi, intelijensi, kompetensi nyata, ekosistem, pusat kendali karier, peningkatan kualifikasi, kesiapan, terverifikasi, objektif, riil, estimasi, berbasis bukti, semantik, match, similarity. Tulis kalimat seperti orang bicara: pendek, konkret, dan tanpa jargon.

### Struktur dan copy landing (pakai teks ini, masukkan lewat `lib/copy.ts`)

**1. Hero**
- Tanpa eyebrow (lihat bagian 4: semua eyebrow dihapus).
- Judul (baris kedua berwarna `--sb-ink-3`):
  `Tahu skill yang dicari,`
  `sebelum kamu melamar.`
- Subjudul: `SkillBridge mengumpulkan lowongan dari berbagai situs kerja, lalu membantumu melihat skill apa yang perlu disiapkan untuk bidang yang kamu tuju.`
- CTA utama: `Mulai gratis` → `/register`. CTA kedua: `Lihat lowongan` → `/jobs`.
- Visual kanan (dengan parallax): kolase kartu kaca berisi **nama bidang** (Data & Analitik, Desain Produk, Pemasaran Digital, Keuangan, Software Engineering, dan lainnya) dan **nama skill umum** sebagai chip (SQL, Figma, Excel, SEO, React, dan lainnya), ditambah motif kotak piksel biru langit yang membentuk jembatan. Visual ini tanpa angka, tanpa nama orang, dan tanpa skor.

**2. Strip sumber**
- `Lowongan dikumpulkan dari` diikuti teks monokrom `Greenhouse · Lever · JobStreet · LinkedIn`. Tulis sebagai teks, bukan logo merek.

**3. Bidang kerja**
- Judul: `Pilih bidang yang kamu tuju`
- Sub: `Bukan cuma data. Telusuri lowongan dari berbagai bidang.`
- Grid kartu kaca. Setiap kartu berisi ikon, nama bidang, dan 3 contoh posisi (misalnya "Data & Analitik: Data Analyst, BI Analyst, Data Scientist"). Kartu menaut ke `/jobs?bidang=<slug>`. Jumlah lowongan per bidang boleh ditampilkan **hanya jika** diambil dari API publik secara langsung. Bidang tanpa lowongan tidak ditampilkan.

**4. Cara kerja (3 langkah, tanpa mockup data)**
1. `Unggah CV` — `PDF atau Word. Kamu bisa memeriksa dan mengoreksi skill yang terbaca.`
2. `Lihat lowongan yang relevan` — `Lowongan ditampilkan beserta skill yang diminta, jadi kamu tahu mana yang sudah kamu punya.`
3. `Siapkan yang masih kurang` — `Simpan skill yang perlu dipelajari dan pantau lamaranmu di satu tempat.`

Visual setiap langkah berupa ilustrasi UI abstrak (kerangka kartu, ikon, garis), tanpa teks data.

**5. Kenapa SkillBridge (3 poin singkat)**
- `Dari lowongan asli` — `Setiap lowongan punya tautan ke sumber aslinya.`
- `CV-mu tetap milikmu` — `File disimpan privat dan bisa kamu hapus kapan saja.`
- `Gratis` — `Tanpa biaya untuk pencari kerja.`
- Satu kalimat di bawahnya yang terkait tema lomba (SDG 8 & 10), dengan teks kecil: `Kami ingin informasi kerja bisa diakses siapa pun, tanpa harus punya koneksi orang dalam.`

**6. FAQ (accordion, 4 pertanyaan)**
- `Apakah SkillBridge gratis?` — `Ya, gratis untuk pencari kerja.`
- `Lowongannya dari mana?` — `Dari situs dan halaman karier publik seperti Greenhouse, Lever, JobStreet, dan LinkedIn. Setiap lowongan menaut ke sumber aslinya.`
- `Apakah CV saya aman?` — `CV disimpan di penyimpanan privat dan hanya bisa diakses olehmu. Kamu bisa menghapusnya kapan saja.`
- `Bidang apa saja yang tersedia?` — Isinya diambil dari daftar bidang di bagian 3 (tulis daftarnya, jangan di-hardcode terpisah).

**7. CTA penutup**
- Latar `--sb-sky-100` dengan motif piksel.
- Judul: `Mulai dari CV yang kamu punya sekarang.`
- Tombol: `Mulai gratis` dan `Coba akun demo`.

**Navbar landing**
- Menu: hapus "Fitur" dan "Cara Kerja". Isinya cukup `Lowongan` (/jobs) dan `Tren Skill` (/insights). Di kanan: `Masuk` (ghost) dan `Mulai gratis` (sky-400, teks `--sb-ink`). Jika sudah login: `Buka Dashboard` + avatar, tanpa nama.
- Hapus strip tab sticky 4 fitur (Analisis CV / Kecocokan Lowongan / Insight Skill / Progres Karier) beserta logika scroll-spy-nya. Jangan dipindah ke navbar.
- Navbar `position: fixed`, dan hero diberi padding-top 72px supaya gradien hero terlihat di belakang navbar.
- **Di puncak halaman:** latar transparan, tanpa border dan shadow, tinggi 72px.
- **Setelah scroll:** latar `white/88`, blur 20px, saturate 150%, border bawah `--sb-glass-border`, shadow `0 4px 16px -8px rgba(14,165,233,0.15)`, tinggi 64px, transisi 200ms. Deteksi memakai sentinel `IntersectionObserver` 8px di atas halaman, bukan scroll listener. Teks konten di belakang navbar tidak boleh terbaca.
- Saat menu mobile terbuka, navbar selalu solid. Menu mobile berupa sheet dari kanan dengan latar putih solid.
- Halaman aplikasi tidak memakai perilaku ini, navbarnya selalu solid.
- Hapus garis hijau tipis di tepi atas halaman. Kalau itu progress bar scroll, ganti ke 2px `--sb-sky-400`.
- Shadow logo cukup `0 1px 2px rgba(24,24,27,0.08)`.

**8. Footer**
- Logo, tautan (Lowongan, Tren Skill, Masuk), dan `© 2026 SkillBridge`. Tidak ada disclaimer skor, tautan Admin, atau Design System.

Hapus seluruh section dan mockup lama dari landing: "CV Match Report", mockup "CV_Budi_Pratama.pdf", daftar "Lowongan untuk Data Analyst" dengan persentase, "Top Skill Paling Dicari" dengan persentase, strip tab 4 fitur sticky, label "Langkah 0X · …", dan "Rekomendasi Belajar".

---

## 3. Bidang dan target kerja (multi-bidang)

Saat ini `ROLE_OPTIONS` di `components/ui/filter.tsx` hanya berisi Data Analyst dan BI Analyst. Selain itu, data lowongan di API tidak punya field kategori, padahal judul lowongannya beragam (Financial Analyst, UI/UX Designer, Frontend Developer, Cyber Security Engineer, Digital Marketing Specialist, PPIC, dan lainnya).

1. Buat satu sumber kebenaran `web/src/lib/job-categories.ts`. Isinya daftar bidang, dengan setiap bidang punya `slug`, `label`, `icon` (lucide), `examples` (3 posisi), dan `keywords` untuk mencocokkan judul:

| slug | label | contoh posisi |
|---|---|---|
| data-analitik | Data & Analitik | Data Analyst, BI Analyst, Data Scientist |
| bisnis-strategi | Bisnis & Strategi | Business Analyst, Product Analyst, Corporate Strategy |
| produk-desain | Produk & Desain | Product Manager, UI/UX Designer |
| software | Software Engineering | Frontend, Full Stack, Backend |
| keamanan-jaringan | Keamanan Siber & Jaringan | Cyber Security, Network Engineer |
| pemasaran | Pemasaran Digital | Digital Marketing, SEO, Content |
| keuangan | Keuangan & Akuntansi | Financial Analyst, Pricing Analyst |
| operasional | Operasional & Supply Chain | PPIC, Logistics, Quality Analyst |
| lainnya | Lainnya | fallback untuk judul yang tidak cocok |

2. Tentukan kategori setiap lowongan di server dari `canonicalTitle` atau `title`, menggunakan `keywords` (case-insensitive). Tambahkan `category` ke respons `/api/jobs`. Kalau kolom `jobs.role_category` ada di database, pakai kolom itu. Kalau tidak ada, hitung saat query. Jangan membuat migrasi besar menjelang demo.
3. Filter "Peran Target" diganti menjadi **"Bidang"** dengan opsi dari `job-categories.ts`. Tampilkan jumlah lowongan per opsi, dan sembunyikan bidang yang kosong. Filter ini dipakai di Job Explorer dan Tren Skill, dan menerima query `?bidang=<slug>` dari landing.
4. **Target kerja pengguna:** di halaman Profil dan onboarding CV, pengguna memilih 1 bidang dan boleh mengetik posisi spesifik (misalnya "UX Researcher"). Simpan di `profiles.target_role` yang sudah ada (bidang dan posisi). Akun demo juri tetap Data & Analitik.
5. Perbarui `AGENTS.md`: role MVP sekarang multi-bidang, bukan hanya Data Analyst dan BI Analyst.

---

## 4. Copy di halaman app: hapus frasa redundan

Prinsipnya: judul halaman cukup satu frasa yang menyebut isi halaman.

**Hapus semua eyebrow di seluruh aplikasi, termasuk landing.** Eyebrow adalah teks kecil atau pill (sering disertai ikon) yang diletakkan di atas judul, misalnya "Platform intelijensi karier berbasis kompetensi nyata", "Pusat Kendali Karier", "Katalog Lowongan Nyata", "Intelijen Pasar Real-Time", "Kesiapan Profil CV", "Statistik Pasar Kerja", "Pipeline Pelacakan", "Rekomendasi Teratas", "Target Belajar", dan label "Langkah 0X · …". Jangan ganti dengan teks lain. Kalau ada komponen khusus untuk eyebrow (misalnya `Eyebrow`, `SectionLabel`, `PageKicker`), hapus komponennya beserta string-nya di `copy.ts`. Label kolom tabel, label form, dan label filter tidak termasuk eyebrow, jadi tetap dipertahankan.

| File | Sekarang | Ganti |
|---|---|---|
| `app/dashboard/page.tsx` | eyebrow "Pusat Kendali Karier" | hapus |
| `app/dashboard/page.tsx` | "Pantau kesiapan kualifikasi CV, analisis kecocokan lowongan kerja riil, dan kelola proses lamaranmu secara terstruktur" | "Ringkasan CV, lowongan, dan lamaranmu." |
| `app/dashboard/page.tsx` | "Tingkat Kesiapan CV: X%" / "Kesiapan Profil CV" | "Skill di CV-mu" dengan daftar skill. Skor per lowongan tetap ada di kartu lowongan |
| `app/progress/page.tsx` | "Rencana Peningkatan Kualifikasi" | "Rencana Belajar" |
| `app/progress/page.tsx` | "…memperbarui estimasi kesiapan kerja." | "Centang skill yang sudah kamu pelajari." |
| `app/jobs/page.tsx` | "Dipadankan secara transparan terhadap lowongan aktif terverifikasi. Skor menunjukkan estimasi…" | "Lowongan dari berbagai situs kerja, diurutkan sesuai CV-mu." (kalau belum login: "Lowongan dari berbagai situs kerja.") |
| `app/jobs/page.tsx` | eyebrow "Katalog Lowongan Nyata" | hapus |
| `app/jobs/[id]/job-detail-client.tsx` | "Rincian Transparan Skor Kecocokan" | "Rincian skor" |
| `app/jobs/[id]/job-detail-client.tsx` | "Membedakan kualifikasi secara transparan menjadi…" | hapus (label chip sudah menjelaskan) |
| `app/insights/page.tsx` | eyebrow "Intelijen Pasar Real-Time", badge "Sampel 52 lowongan aktif" | hapus eyebrow, badge jadi "52 lowongan aktif" |
| `components/layout/footer.tsx` | disclaimer skor | pindahkan ke satu kalimat kecil di bawah skor detail lowongan saja |

Ubah juga `lib/copy.ts` agar mengikuti aturan ini, dan grep frasa terlarang di bagian 2 untuk seluruh `web/src/app` dan `web/src/components`.

---

## 5. Perbaikan bug dari pengecekan sebelumnya

1. **Cache setelah login/logout.** Kunjungan pertama ke `/jobs` setelah login demo menampilkan "Belum ada skor", dan skor baru muncul setelah reload.
   - Setelah login (termasuk demo) dan logout, bersihkan seluruh cache data di client (SWR/React Query: clear atau mutate semua key) sebelum redirect.
   - Tambahkan `Vary: Cookie` di `/api/jobs` dan `/api/insights`. Respons untuk pengguna login tetap `private, no-store`.
2. **Scroll reveal membuat layar kosong.** Saat ini seluruh section memakai `opacity-0` sampai 15% bagiannya terlihat.
   - Reveal hanya pada elemen anak, dengan threshold 0, `rootMargin: "0px 0px 15% 0px"`, dan durasi ≤ 400ms.
   - Konten tetap terlihat kalau JS belum jalan: `opacity-0` hanya aktif di bawah class `html.js-ready` yang dipasang di client.
3. **Rekomendasi tidak sesuai target.** Akun demo dengan target Data Analyst mendapat rekomendasi teratas Financial Analyst dan Cyber Security.
   - Dashboard dan default Job Explorer menyaring lowongan berdasarkan bidang target pengguna (bagian 3), lalu mengurutkan berdasarkan `matchScore`. Bidang lain tetap bisa dilihat lewat filter.
4. **Parallax tidak dibatasi.** Clamp `translateY` di `useParallax` maksimal ±80px, dan hitung hanya saat elemen berada di viewport.
5. **Mobile:** judul halaman memakai `text-wrap: balance`, dan "CV-mu" memakai non-breaking hyphen (U+2011) agar "mu" tidak tersisa sendirian di baris baru.
6. Tombol "Coba dengan akun demo" di halaman login masih hijau. Ganti dengan tombol primary biru langit.
7. Di Tren Skill, saat belum login, jangan tampilkan "Belum ditemukan di CV". Ganti dengan satu baris ajakan: "Masuk untuk membandingkan dengan CV-mu."

---

## 6. Animasi (landing saja)

- Parallax hero: orb latar (0.2x), motif piksel (0.4x), dan kolase kartu bidang (0.6x). Teks diam.
- Kotak piksel muncul bertahap (stagger) membentuk jembatan saat hero tampil.
- Kartu bidang dan langkah cara kerja: reveal halus per kartu (aturan di bagian 5.2).
- Parallax mati di layar < 768px dan saat `prefers-reduced-motion: reduce`.
- Jangan memasang `backdrop-filter` pada elemen yang ikut bergerak.

---

## 7. Jangan diubah

Route API selain yang disebut di bagian 3 dan 5, `middleware.ts`, rumus di `lib/matching*`, auth, dan worker. Komponen kaca, cincin skor, dan master-detail di halaman app tetap dipakai, cukup ganti warnanya ke palet baru.

---

## 8. Cek sebelum merge

1. `cd web && npm run lint && npm run build && npm test` harus lolos semua.
2. **Landing dalam keadaan logout dan login harus identik isinya**, kecuali tombol header. Grep di `app/page.tsx` dan komponen landing: tidak boleh ada `matchScore`, `%`, `skor`, `cocok`, `kesiapan`, `Budi`, `CV_`.
3. Grep warna terlarang di `web/src`: `blue-`, `indigo-`, `navy`, `slate-9`, `#2556E8`, `#1B42C4`, `#172033`, `#253B62`, `#161A2B`, `bg-royal`, `page-hero`. Hasilnya harus kosong.
4. Buka setiap halaman (landing, login, register, dashboard, CV, lowongan, detail, tren skill, lamaran, rencana belajar, profil): tidak boleh ada teks atau pill kecil di atas judul mana pun.
5. Grep frasa terlarang (bagian 2) di `web/src/app`, `web/src/components`, dan `web/src/lib/copy.ts`. Hasilnya harus kosong, kecuali di komentar kode.
6. Klik setiap kartu bidang di landing: `/jobs?bidang=<slug>` terbuka dengan filter yang sudah terpilih dan minimal 1 lowongan.
7. Login demo → `/jobs`: skor langsung tampil tanpa reload, dan lowongan teratas berasal dari bidang Data & Analitik.
8. Logout → scroll cepat landing dari atas ke bawah: tidak ada layar kosong.
9. Cek kontras teks di tombol primary dan banner dengan DevTools: minimal 4.5:1.
10. Screenshot landing, dashboard, dan Job Explorer di 1440px dan 375px, lalu simpan di `docs/redesign/revisi-2/`.

Laporkan ringkasan perubahan, daftar commit, dan keputusan yang kamu ambil sendiri.
