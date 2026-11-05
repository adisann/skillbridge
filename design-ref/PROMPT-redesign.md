# Prompt: Porting Desain Figma ke SkillBridge (Glassmorphism Biru Tipis + Parallax)

Kamu adalah senior UI engineer dan product designer. Tugasmu adalah memindahkan bahasa visual dari desain Figma Make ke aplikasi SkillBridge yang sebenarnya, lalu menambahkan glassmorphism biru tipis dan parallax. Logika bisnis, API, auth, dan data tidak boleh berubah. Deadline lomba 7 November 2026, jadi utamakan hasil yang stabil dan rapi daripada efek berlebihan.

Baca dulu `AGENTS.md` di root repo dan `web/AGENTS.md`, lalu ikuti aturannya. Aplikasi ada di `web/` (Next.js 16 App Router, React 19, Tailwind v4), dan dev server berjalan di `localhost:3001`.

---

## 0. Konteks penilaian (acuan setiap keputusan desain)

| Aspek penyisihan INVOFEST 2026 | Bobot | Artinya untuk pekerjaan ini |
|---|---|---|
| Tampilan dan Desain | 30% | Satu sistem visual yang konsisten di semua halaman |
| Kreativitas dan Inovasi | 25% | Parallax dan motif khas, bukan template generik |
| Kemudahan Pengguna dan Responsivitas | 20% | Mobile-first, kontras terbaca, animasi tidak mengganggu |
| Originalitas | 15% | Jangan menyalin aset dari situs referensi luar. Ambil prinsipnya saja |
| Kesesuaian dengan Tema | 10% | "Smart Ecosystems: Digital Solutions for a Sustainable Future", subtema Digital Economy & Sociopreneurship (SDG 8 & 10) |

Aturan lomba: dilarang memakai full template dan CMS.

---

## 1. Sumber desain dan alur branch

**Sumber desain utama ada di `design-ref/figma-make/`.** Ini adalah ekspor Figma Make (Vite + React + Tailwind v4, single-page dengan state tab). Ini **bukan** branch git, dan tidak boleh di-merge apa adanya. Tugasmu adalah memindahkan elemen visualnya ke komponen Next.js yang sudah ada.

- Abaikan `design-ref/figma-make/AGENTS.md` dan `CLAUDE.md`, karena keduanya instruksi untuk lingkungan Figma, bukan untuk proyek ini.
- Screenshot render ekspor ini ada di `design-ref/screenshots/` (`landing.png`, `lowongan.png`, `insight.png`). Kalau ingin melihat versi interaktifnya, jalankan dari folder tersebut: `npm install && npx vite --port 5173`. Hapus plugin `figma` di `vite.config.ts` kalau error. Jalankan hanya di dalam `design-ref/`, jangan sampai mengubah `web/`.
- Data di `design-ref/figma-make/src/data/skillBridgeData.ts` adalah data mock. **Jangan dipakai.** Semua data tetap berasal dari API SkillBridge yang sudah ada.
- Tambahkan `design-ref/figma-make/node_modules` ke `.gitignore`.

Alur git:

1. Jalankan `git status`. Kalau ada perubahan yang belum di-commit selain folder `design-ref/`, berhenti dan laporkan. Jangan stash atau reset sendiri.
2. Buat branch dari `main`: `git switch -c feat/figma-glass-redesign`.
3. Commit pertama: `chore(design): add figma make export as design reference` (folder `design-ref/` tanpa node_modules).
4. Sesudahnya commit kecil per langkah, dengan format conventional commit seperti riwayat repo (`style(ui): ...`, `feat(ui): ...`).
5. Setelah semua cek di bagian 8 lolos, merge ke `main` secara lokal dengan `git merge --no-ff feat/figma-glass-redesign`. **Jangan push** sebelum pemilik repo mengizinkan. Laporkan ringkasan perubahan dan daftar commit.

---

## 2. Logo (ambil dari desain Figma)

Logo di ekspor Figma ada di `src/App.tsx` baris sekitar 189 (header) dan 410 (footer): kotak membulat berisi ikon kompas (`Compass` dari lucide-react), dengan wordmark "Skill" berwarna ink dan "Bridge" berwarna biru.

- Ganti isi `web/src/components/ui/logo.tsx` dengan logo ini. Props yang sudah ada (`size`, `showText`, `href`) dipertahankan supaya semua pemakaian tetap jalan.
- Kotak ikon memakai gradien biru dari token di bagian 3 (`--sb-blue-600` ke `--sb-blue-400`) dengan ikon putih, ditambah ring kaca tipis (`ring-1 ring-white/40`) dan shadow biru lembut. Versi footer di Figma yang berwarna `slate-950` diganti dengan versi biru yang sama, supaya cuma ada satu logo.
- Ekspor SVG mandiri ke `web/public/logo.svg` dan `web/public/logo-mark.svg` (gambar ulang path ikon kompas lucide di dalam kotak), lalu buat favicon dari `logo-mark.svg`. `public/favicon.svg` di ekspor Figma adalah ikon default Figma, jadi **jangan dipakai**.
- Hapus file bawaan Next yang tidak dipakai di `web/public`: `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`.

---

## 3. Sistem warna: glassmorphism biru tipis

Titik awalnya adalah `design-ref/figma-make/src/index.css`. Di sana sudah ada kelas `.glass-header`, `.glass-panel`, `.glass-soft`, `.page-hero`, `.gradient-button`, `.lift-card`, latar radial gradient, serta font Plus Jakarta Sans dan JetBrains Mono. Pindahkan kelas-kelas ini ke `web/src/app/globals.css` dengan dua koreksi:

1. **Geser semua nuansa ungu/indigo ke biru murni.** Ekspor Figma masih memakai `#3f5fbf`, `rgba(103, 92, 245, …)`, `rgba(93, 86, 230, …)`, dan `rgba(100, 99, 180, …)` yang cenderung violet. Ganti semuanya dengan token biru di bawah.
2. **Tambah transparansi agar kaca benar-benar terasa.** `.glass-panel` di Figma memakai putih 94%, jadi hampir solid. Turunkan ke 62–72%, dan beri latar orb biru yang cukup terlihat di belakangnya.

Definisikan token di `:root` dan petakan ke `@theme inline` agar bisa dipakai sebagai kelas Tailwind. Jangan menulis hex langsung di komponen.

```css
:root {
  --sb-blue-50:  #F3F7FF;   /* latar halaman */
  --sb-blue-100: #E6EEFF;
  --sb-blue-200: #CCDCFF;
  --sb-blue-400: #5B8CFF;
  --sb-blue-600: #2556E8;   /* primary: tombol, link, fokus */
  --sb-blue-700: #1B42C4;   /* hover primary */
  --sb-navy-900: #172033;   /* hero gelap (dari .page-hero Figma) */
  --sb-navy-700: #253B62;
  --sb-cyan-300: #7DD3FC;   /* aksen motif piksel, highlight */
  --sb-ink:      #161A2B;   /* teks utama (dari Figma) */
  --sb-ink-2:    #4A5570;   /* teks sekunder */
  --sb-ink-3:    #687087;   /* teks muted (dari Figma) */

  --sb-glass-bg:        rgba(255, 255, 255, 0.66);
  --sb-glass-bg-strong: rgba(255, 255, 255, 0.84);
  --sb-glass-border:    rgba(37, 86, 232, 0.12);
  --sb-glass-shadow:    0 1px 2px rgba(22, 26, 43, 0.04), 0 18px 48px -12px rgba(37, 86, 232, 0.14);
  --sb-glass-blur:      18px;

  --sb-good:     #238A7A;   /* dari StatusBadge Figma */
  --sb-warning:  #B7791F;
  --sb-critical: #D63B3B;
}
```

Aturan pemakaian:

- **Latar halaman:** `--sb-blue-50` ditambah 2–3 orb radial biru/cyan (opacity 0.15–0.35, blur besar) di belakang konten, seperti `body` dan `.app-shell` di Figma tapi sedikit lebih kuat. Tanpa latar berwarna, kaca hanya terlihat seperti putih pudar.
- **Kartu kaca (`.glass`):** `background: var(--sb-glass-bg)`, `backdrop-filter: blur(var(--sb-glass-blur)) saturate(140%)`, border `--sb-glass-border`, radius 20–24px (sesuai Figma), dan `inset 0 1px 0 rgba(255,255,255,0.8)` sebagai highlight tepi.
- **Navbar dan sidebar:** `--sb-glass-bg-strong`, supaya teks tetap terbaca saat konten lewat di belakangnya.
- **Banner gelap (`.page-hero`):** pertahankan gradien navy dari Figma (`--sb-navy-900` ke `--sb-navy-700` ke `--sb-blue-600`). Banner ini dipakai di header Job Explorer dan section "Kecocokan lowongan" di landing. Di atas banner gelap, kartu kaca memakai `rgba(255,255,255,0.12)` dengan border putih 20%.
- **Tombol:** primary memakai `.gradient-button` versi biru. CTA penutup memakai ink gelap (seperti "Lihat progres karier" di Figma). Secondary berupa kaca dengan border biru tipis. Semua tombol berbentuk pill (`rounded-full`) seperti di Figma.
- **Kontras:** semua teks di atas kaca minimal rasio 4.5:1 (WCAG AA). Teks body jangan memakai `--sb-ink-3`.
- **Fallback:** `@supports not (backdrop-filter: blur(1px))` mengganti kaca dengan `--sb-glass-bg-strong` solid.
- Hapus warna di luar sistem dari `web/src`: emerald pada logo lama, `purple-`, `violet-`, `indigo-`, serta hex acak.
- Light mode saja untuk sekarang, tapi semua warna wajib lewat token supaya dark mode mudah ditambah nanti.

**Tipografi (ikuti Figma):** Plus Jakarta Sans (400–800) untuk teks, dan JetBrains Mono untuk angka metrik (skor, poin, persentase), lewat kelas `.font-mono-metric`. Muat lewat `next/font/google` di `web/src/app/layout.tsx`, bukan lewat `<link>`. Judul hero berukuran besar dengan clamp 40–64px, weight 800, tracking rapat (`tracking-tight`), sama seperti "Karier yang tepat dimulai dari skill yang kamu punya." di Figma.

**Motif khas (untuk originalitas):** grid kotak piksel kecil biru–cyan yang "tersusun" membentuk jembatan, digambar sendiri dengan SVG atau CSS grid. Pakai hemat: di belakang mockup hero (menggantikan atau melengkapi blok biru offset di Figma), sebagai divider antarsection, dan di CTA penutup.

---

## 4. Animasi: parallax

Jangan tambahkan GSAP atau Three.js. Kalau memang butuh library, cukup `motion` (Framer Motion v11+), satu saja. Ekspor Figma belum punya parallax, jadi bagian ini dibuat baru.

Cakupan:

- **Landing page (efek penuh):**
  - Hero: 3 layer bergerak dengan kecepatan berbeda saat scroll, yaitu orb latar (0.2x), blok biru offset dan motif piksel (0.4x), serta mockup "CV Match Report" dan kartu "Rekomendasi berikutnya" yang melayang (0.7x dan 0.9x). Teks hero tetap diam agar mudah dibaca.
  - Kotak piksel muncul bertahap (stagger) membentuk jembatan saat hero pertama tampil.
  - Setiap section fitur (Analisis CV, Kecocokan, Insight, Progres): mockup naik pelan dan fade-in saat masuk viewport (translateY 24px → 0, 400–600ms, `cubic-bezier(0.22,1,0.36,1)` sesuai Figma). Bar skill di section Insight terisi dari 0 ke nilainya.
  - Strip tab 4 fitur di bawah hero menjadi sticky dan menyorot tab section yang sedang terlihat (scroll-spy).
- **Halaman app (dashboard, jobs, insights, tracker, cv):** tanpa parallax. Cukup `.page-transition` dari Figma, `.lift-card` saat hover, dan cincin skor yang terisi sekali saat pertama tampil.

Aturan teknis:

- Buat satu hook `useParallax(speed)` di `web/src/lib/hooks/` yang memakai `requestAnimationFrame` dan hanya mengubah `transform: translate3d()`. Atau pakai CSS scroll-driven animation (`animation-timeline: view()`) dengan fallback statis.
- Pakai `IntersectionObserver` untuk reveal, lalu `unobserve` setelah elemen tampil.
- Pasang `will-change: transform` hanya pada layer yang bergerak. **Jangan** memasang `backdrop-filter` pada elemen yang ikut bergerak saat parallax, karena berat di GPU. Kartu kaca yang bergerak diberi latar putih semi-solid saja.
- **Hormati `prefers-reduced-motion`:** parallax, stagger, dan animasi isi bar mati total, cukup fade. Perluas blok reduced-motion yang sudah ada di `globals.css`.
- Di layar < 768px, kecepatan parallax dikurangi setengahnya atau dimatikan.
- Target: CLS < 0.1 dan scroll tetap mulus di 60fps.

---

## 5. Elemen yang diambil dari Figma, dipetakan ke file Next.js

| Elemen di Figma | File sumber (`design-ref/figma-make/src/`) | Tujuan di `web/src/` | Catatan |
|---|---|---|---|
| Header kaca, nav dengan garis bawah aktif, tombol pill "Mulai analisis" | `App.tsx` | `components/layout/navbar.tsx` | Nav landing tetap memakai anchor ke section |
| Footer ringkas + disclaimer satu baris | `App.tsx` | `components/layout/footer.tsx` | Tombol "Admin" jangan ditampilkan di footer publik |
| Hero split: judul besar + mockup "CV Match Report" + kartu melayang | `components/LandingView.tsx` | `app/page.tsx` | Isi mockup memakai contoh statis yang jujur, bukan klaim angka palsu |
| Strip tab 4 fitur | `LandingView.tsx` | `app/page.tsx` | Dijadikan sticky + scroll-spy |
| Section zig-zag fitur (teks kiri, mockup kanan, dan sebaliknya) | `LandingView.tsx` | `app/page.tsx` | Section Kecocokan memakai `.page-hero` gelap |
| Cincin skor (89% "Kuat") | `JobExplorerView.tsx` | buat `components/ui/score-ring.tsx` | Pakai di kartu lowongan, detail, dan dashboard. Kalau skor `null`, tampilkan "Belum ada skor" |
| Kartu lowongan (badge role, level, cincin skor, status, simpan) | `JobExplorerView.tsx` | komponen JobCard di `app/jobs/page.tsx` | Kartu terpilih diberi border biru |
| Layout master–detail lowongan (list kiri, detail kanan) di desktop | `JobExplorerView.tsx` | `app/jobs/page.tsx` | Di mobile tetap navigasi ke `/jobs/[id]` |
| Banner judul halaman gelap ("Temukan lowongan yang paling sesuai") | `JobExplorerView.tsx` | `app/jobs`, `app/insights`, `app/dashboard` | Gantikan header polos |
| Panel filter kaca + chip status | `JobExplorerView.tsx` | `components/ui/filter.tsx` | Di mobile, filter dibuka lewat bottom sheet |
| Rincian skor 4 kotak dengan angka mono ("55/55 poin") | `JobExplorerView.tsx` | `app/jobs/[id]/job-detail-client.tsx` | Tampilkan kelima komponen termasuk semantik |
| Badge status dengan ikon (Cocok, Perlu penguatan skill, Melampaui level, Bukti CV belum cukup) | `components/StatusBadge.tsx` | `components/ui/badge.tsx` | Label diambil dari `copy.ts` |
| Daftar skill teratas bernomor dengan bar | `MarketInsightsView.tsx` | `app/insights/page.tsx` | |
| Kartu file CV + grid skill terdeteksi dengan bukti teks | `OnboardingCVView.tsx` | `app/cv/page.tsx` | |
| Rencana belajar + progres | `MyProgressView.tsx` | `app/progress/page.tsx` | |
| Toast feedback gelap di bawah tengah | `App.tsx` | komponen toast global | |

Halaman yang tidak ada di Figma (login, register, tracker, profile, dashboard) cukup mengikuti komponen dasar yang baru: kaca, tombol pill, banner gelap, dan cincin skor.

---

## 6. Urutan pengerjaan

1. `globals.css`: token, kelas kaca, orb, `.page-hero`, `.gradient-button`, `.lift-card`, `.page-transition`, keyframes reveal, dan blok reduced-motion.
2. `layout.tsx`: font Plus Jakarta Sans + JetBrains Mono.
3. Komponen dasar `components/ui/`: `logo`, `button`, `card` (varian `glass` sebagai default, `solid` tetap tersedia), `badge`, `score-ring` (baru), dan `filter`.
4. Layout: `navbar`, `sidebar`, `footer`, `root-shell` (orb latar dipasang di sini).
5. Landing `app/page.tsx` + parallax.
6. Halaman app sesuai tabel di bagian 5.
7. `app/design-system/page.tsx`: tampilkan token dan komponen baru. Halaman ini juga bukti originalitas untuk juri. Jangan ditautkan dari footer publik.

Jangan mengubah: route API, `middleware.ts`, `lib/matching*`, auth, worker, dan isi `copy.ts` (boleh menambah string baru). Teks dari Figma yang bagus (misalnya "Karier yang tepat dimulai dari skill yang kamu punya.") boleh dipakai, tapi dimasukkan lewat `copy.ts`.

---

## 7. Best practice yang wajib

- Mobile-first. Cek di lebar 375, 768, 1024, dan 1440px. Tidak boleh ada scroll horizontal.
- Area sentuh minimal 44×44px. Fokus keyboard terlihat di semua elemen interaktif.
- Elemen yang bisa diklik harus `<button>` atau `<a>`, bukan `<div onClick>`.
- Gambar dekoratif (orb, motif piksel, blok offset) diberi `aria-hidden="true"`.
- Jangan menumpuk lebih dari 2 lapis kaca di area yang sama.
- Spasi memakai skala 4/8px. Radius cukup 3 nilai: 12 (input, chip), 20 (kartu), dan full (tombol).
- Bahasa UI tetap Bahasa Indonesia dengan sapaan "kamu", sesuai `copy.ts`.

---

## 8. Cek sebelum merge

1. `cd web && npm run lint && npm run build && npm test` harus lolos semua.
2. Buka `localhost:3001` dan uji alur demo juri: Landing → "Coba dengan akun demo" → Dashboard → Upload CV → Cari Lowongan → Detail → Tren Skill → Lamaran Saya. Tidak boleh ada fitur yang rusak.
3. Bandingkan dengan `design-ref/screenshots/`. Landing dan Job Explorer harus terasa satu keluarga dengan desain Figma, tapi dengan warna biru (bukan violet) dan kaca yang lebih transparan.
4. Simpan screenshot sesudah redesign untuk landing, dashboard, Job Explorer, dan detail lowongan di desktop (1440) dan mobile (375), di `docs/redesign/`.
5. Nyalakan emulasi `prefers-reduced-motion: reduce` di DevTools, lalu pastikan parallax mati.
6. Lighthouse mobile di landing: Performance ≥ 85, Accessibility ≥ 95.
7. Grep `emerald-`, `purple-`, `violet-`, `indigo-`, `rgba(103, 92`, dan hex warna di `web/src/components` dan `web/src/app`: hasilnya harus kosong, kecuali di `globals.css`.

Kalau ada keputusan desain yang ragu, pilih opsi paling sederhana, lalu catat alasannya di laporan akhir.
