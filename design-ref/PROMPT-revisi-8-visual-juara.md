# Prompt Revisi 8: Naikkan Level Visual Landing (hasil review desain)

Lanjutkan di SkillBridge (`web/`). Baca `AGENTS.md` dan `web/AGENTS.md` dulu (Next.js di sini punya breaking changes; cek `node_modules/next/dist/docs/` sebelum menulis kode), lalu baca bagian "Acuan lomba" di bawah.

## Aturan kerja (WAJIB)

- **JANGAN commit, stage, stash, merge, rebase, atau push apa pun.** Tidak ada `git add`, `git commit`, `git stash`, `git merge`, `git push`. Satu-satunya perintah git yang boleh yang mengubah state: `git switch -c feat/visual-upgrade` di Phase 0. Perubahan dibiarkan sebagai working tree (uncommitted) supaya pengguna bisa menilai dan memutuskan sendiri.
- Jangan sentuh file di luar tugas ini. Perubahan lama yang sudah ada di working tree (`AGENTS.md` modified, `docs/*-2026-11-06.md` untracked) biarkan apa adanya.
- **Kerjakan PER PHASE. Di akhir setiap phase: STOP.** Tulis ringkasan (apa yang berubah, file yang disentuh, apa yang perlu dilihat pengguna di browser), lalu TUNGGU pengguna membalas "lanjut" atau meminta revisi. Jangan lanjut ke phase berikutnya sebelum ada balasan. Jika pengguna menulis "lanjut semua", barulah boleh berjalan beruntun tanpa berhenti.
- Tidak ada pembuatan aset gambar, tidak ada generator gambar/MCP, tidak ada file gambar baru. Semua visual dibangun dengan SVG, CSS, dan ikon `lucide-react` yang sudah ada.
- Ubah kode dengan tool edit file. Screenshot pakai `npx --yes playwright@1.48.2 screenshot ... --timeout=30000` (1440x900 dan 390x844), simpan ke `docs/redesign/visual-upgrade/` (jangan di-stage).
- Di akhir tiap phase jalankan `npm run lint` dan `npm run typecheck`. `npm run build` dan `npm test` dijalankan di Phase 6.
- Jangan menambah dependency baru.

## Acuan lomba (dari Guidebook INVOFEST 2026 dan `AGENTS.md`)

Penilaian penyisihan: **Tampilan dan Desain 30%**, **Kreativitas dan Inovasi 25%**, **Kemudahan Pengguna dan Responsibilitas 20%**, **Originalitas 15%**, **Kesesuaian Tema 10%** (Digital Economy & Sociopreneurship, SDG 8 & 10). Karya juga dinilai lewat video demo 3-10 menit (min. 720p), jadi hero dan animasinya harus enak direkam dan terbaca jelas di layar presentasi.

Pemetaan kerja ke penilaian: Phase 1-2 (tampilan, kemudahan), Phase 3-4 (kreativitas, originalitas lewat motif jembatan yang hanya cocok untuk SkillBridge), Phase 5 (tampilan, ritme, tema), Phase 6 (responsibilitas, aksesibilitas).

Sesuaikan dengan dokumen proyek:
- `AGENTS.md` bagian 11: landing tetap memuat masalah, cara kerja 3 langkah, dan CTA ke analisis CV. Bagian 12: responsif, navigasi keyboard, status non-warna, skeleton/loading. Bagian 14: halaman `/design-system` harus menampilkan semua varian komponen (diperbarui di Phase 5).
- `docs/user-requirements.md`: SDG 8 & 10, jangan klaim sumber lowongan/hasil model yang belum ada.
- `design-ref/PROMPT-revisi-6.md` dan `PROMPT-revisi-7-landing-story.md`: aturan copy, token, dan kejujuran data tetap berlaku. Struktur section dan copy landing hasil revisi 7 TIDAK diubah, kecuali disebut di bawah.

## Tujuan

Copy dan fungsi sudah kuat, tetapi visual masih terasa "baseline AI" (gradasi biru pucat + kartu kaca) dan nilai produk belum terlihat dalam 3 detik pertama. Sasaran:
1. Hero langsung menunjukkan nilai produk lewat animasi: skill yang belum ada di CV adalah "papan bolong" yang menghalangi jembatan ke lowongan.
2. DNA visual khas: motif **jembatan** (SkillBridge), dipakai hemat dan konsisten.
3. Ritme halaman tidak monoton, dan kredibilitas data naik.

## Aturan yang tetap berlaku (dari revisi sebelumnya)

- Pakai token `--sb-*` di `globals.css`. Jangan membuat palet baru. Satu-satunya tambahan: turunan transparan dari token yang ada (`--sb-warning-soft`, `--sb-good-soft`).
- Font tetap Plus Jakarta Sans. Tidak ada abu-abu. Tidak ada testimoni, logo, atau angka karangan; angka asli dari `fetchDeduped`/query yang sudah ada.
- Jangan menampilkan nama sumber data, `retrievalMethod`, atau jumlah sumber di UI (aturan Revisi 6).
- Status selalu punya teks, bukan hanya warna ("Sudah tercantum" / "Belum ditemukan"). Pakai "belum ditemukan", bukan "tidak punya".
- Teks minimal 12px. Kontras AA (4.5:1 body, 3:1 teks besar/komponen). Tanpa eyebrow.
- Semua teks baru lewat `lib/copy.ts` (`landing.*`), bukan di JSX.
- Jangan sentuh: `worker/`, `supabase/`, auth, API routes, logika matching, routing.

**Pengecualian yang disengaja di revisi ini** (sebelumnya dilarang, sekarang boleh hanya sejauh ini):
- `--sb-navy` boleh jadi latar untuk SATU section kontras di landing (Phase 5).
- Hero boleh punya SATU animasi loop (jembatan tersambung, Phase 3), murni CSS (`transform` dan `opacity`), berhenti saat hero keluar layar (`.hero-paused`) dan statis saat `prefers-reduced-motion`.
- Hero boleh menampilkan SATU kartu "Contoh hasil" berlabel jelas; isinya hitungan ("4 dari 8 skill wajib sudah tercantum"), bukan persentase kecocokan.

---

## Phase 0: Persiapan, branch, dan audit (tanpa mengubah kode aplikasi)

1. Cek `git branch --show-current` dan `git status --short`. Jalankan `git switch -c feat/visual-upgrade` dari branch saat ini. Jika gagal karena konflik working tree, STOP dan laporkan, jangan stash atau reset.
2. Dari folder `web/`, jalankan dev server DI BRANCH INI: `npm run dev -- -p 3001` sebagai proses background. Jika port 3001 sudah dipakai, jangan membunuh prosesnya; laporkan proses apa itu dan tanyakan ke pengguna. Setelah jalan, pastikan `http://localhost:3001/` merespons 200, lalu biarkan server tetap hidup sepanjang revisi (hot reload cukup, jangan restart).
3. Audit: buka `components/landing/*` (hero, hero-skill-chips, problem, solution, how-it-works, fields, trust, closing), `components/ui/score-ring.tsx`, `skill-chips.tsx`, `pixel-bridge.tsx`, `card.tsx`, `button.tsx`, `lib/copy.ts` → `landing.*`, dan `app/design-system/page.tsx`.
4. Ukur kontras nyata teks `--sb-text-2` di atas latar section yang memakainya (putih, `--sb-mist-faint`, `--sb-mist-soft`, kartu kaca). Catat yang di bawah 4.5:1.
5. Cari di mana urutan default `/lowongan` ditentukan (`job-explorer.tsx` dan query-nya) dan cara jumlah lowongan per bidang dihitung di `fields.tsx`.
6. Screenshot baseline `/`, `/lowongan`, `/tren-skill` di 1440 dan 390 ke `docs/redesign/visual-upgrade/before-*.png`.
7. **STOP.** Laporkan: nama branch, URL dev server, ringkasan temuan audit (maks 10 baris). Tunggu "lanjut".

## Phase 1: Kontras dan CTA

1. Tombol primary "Mulai gratis" tetap `--sb-sky` + teks `--sb-navy` (aturan token), tetapi dibuat lebih tegas: `font-bold`, shadow berwarna (`rgba(0,90,156,.28)`), ring tipis `--sb-blue` pada hover dan focus, ukuran `lg`. Jangan jadikan latar navy.
2. Tombol secondary: outline `--sb-blue`, teks `--sb-blue`, latar putih.
3. Perbaiki setiap teks yang kontrasnya di bawah AA hasil Phase 0 (paling mungkin `--sb-text-2` di atas `--sb-mist-soft`): naikkan opacity token atau pakai `--sb-navy` di titik yang bermasalah. Jangan menambah abu-abu.
4. Tambah token `--sb-warning-soft` dan `--sb-good-soft` (warna status ~12% di atas putih).
5. Lint + typecheck. **STOP**, minta pengguna menilai `/` di `localhost:3001` (fokus: tombol dan keterbacaan teks). Tunggu "lanjut".

## Phase 2: Kredibilitas data

1. `fields.tsx`: sembunyikan jumlah lowongan pada kartu bidang yang jumlahnya < 10 (tetap tampilkan "Lihat posisi" + panah). Tautan ke `/lowongan?bidang=<slug>` tidak berubah.
2. Strip statistik tipis di bawah hero (`components/landing/stats-strip.tsx`), 3 item dari data asli: total lowongan aktif, jumlah bidang yang punya lowongan, tanggal pembaruan terakhir. Tanpa jumlah sumber, tanpa persentase. Angka besar (`text-3xl font-extrabold text-sb-navy`), label 12-14px.
3. `/lowongan`: ubah urutan default supaya lowongan dari bidang inti (Data & Analitik, Bisnis & Strategi, Produk & Desain, Software Engineering) muncul lebih dulu, lalu terbaru. Lowongan non-inti tetap ada dan tetap bisa difilter. Hanya urutan tampilan default di sisi web; jangan ubah data atau worker. Pastikan filter dan pagination tetap benar.
4. Lint + typecheck. **STOP**, minta pengguna menilai `/` dan `/lowongan`. Tunggu "lanjut".

## Phase 3: Scene jembatan beranimasi (kode saja)

Buat `components/landing/hero-bridge-scene.tsx` (client component), satu "panggung" `aspect-[3/2]` yang skalanya mengikuti lebar container (SVG `viewBox`, elemen HTML diposisikan dengan persen). Isi:

1. **Kartu CV (kiri):** kartu kaca (`.sb-glass`) berisi lingkaran avatar `--sb-mist`, 3 batang teks abstrak (bukan teks nyata), dan 3 chip skill kecil. Ikon `FileText` sebagai penanda.
2. **Kartu lowongan (kanan):** kartu kaca dengan ikon `Briefcase` (`--sb-navy`), judul contoh "Data Analyst", dan 3 chip skill yang diminta. Chip yang belum ada di CV memakai gaya "belum ditemukan" (border putus-putus `--sb-warning`, latar `--sb-warning-soft`).
3. **Jembatan (tengah):** SVG lengkung dengan 7 ubin rounded-rect mengikuti busur (diputar mengikuti garis singgung), warna `--sb-sky` dan `--sb-mist` bergantian. SATU ubin tengah adalah slot kosong: outline putus-putus `--sb-warning` + glow lembut `--sb-warning-soft`. Dua pilar tipis di bawah ujung busur (`--sb-mist-soft`).
4. **Aksen piksel:** 3-5 kotak piksel kecil `--sb-sky`/`--sb-mist` melayang di sekitarnya, selaras dengan `PixelArrow`.

Animasi, satu loop ±9 detik, CSS keyframes saja:
- 0-2s: ubin menyala berurutan kiri ke kanan (scale 1 → 1.06 + kecerahan naik), berhenti di slot kosong yang berdenyut amber.
- 2-4s: satu chip "belum ditemukan" terangkat dari kartu lowongan, melayang melengkung ke slot kosong.
- 4-5.5s: chip masuk, slot menjadi ubin `--sb-sky` solid, jembatan terlihat tersambung, ikon koper menerima centang kecil `--sb-good` dengan teks "Terhubung" yang muncul sebentar.
- 5.5-9s: jeda, fade halus kembali ke awal (slot kosong), ulangi.
- `prefers-reduced-motion`: keadaan statis (slot kosong + chip "Belum ditemukan" di sebelahnya), tanpa loop.
- Jeda dengan `animation-play-state: paused` saat `.hero-paused` aktif.

Semua teks scene lewat `lib/copy.ts`, diberi label kecil "Contoh" (bukan data pengguna). Pasang scene di kolom kanan hero MENGGANTIKAN kartu bidang melayang berchip ×; pertahankan `PixelArrow`, parallax, dan pause-di-luar-viewport yang sudah ada. Hapus komponen yang tidak terpakai lagi.

Lint + typecheck. **STOP**, minta pengguna menilai animasi di `localhost:3001` (desktop dan jendela sempit). Tunggu "lanjut".

## Phase 4: Finishing hero

1. Kolom kiri tidak berubah (heading, subjudul, CTA, copy revisi 7).
2. Tambah satu kartu kaca kecil "Contoh hasil" di pojok kanan bawah scene (jangan menutupi kartu CV dan lowongan): judul posisi contoh, ringkasan "4 dari 8 skill wajib sudah tercantum", dua baris status "Sudah tercantum" (centang, `--sb-good`) dan "Belum ditemukan" (`--sb-warning-soft`). Pakai komponen asli (`skill-chips.tsx`, `badge.tsx`; `score-ring.tsx` hanya bila bisa tanpa persentase). Teks via `lib/copy.ts`.
3. Animasi masuk hero satu kali (fade/translate ≤ 400ms), mati saat reduced-motion.
4. H1 desktop naik ke `clamp(2.75rem, 5vw, 4.25rem)`, tetap dua baris di 1280px ke atas (`[text-wrap:balance]` dipertahankan).
5. Mobile 390px: scene di bawah teks, skala mengecil tapi tetap terbaca, tanpa scroll horizontal.
6. Lint + typecheck. **STOP**, minta pengguna menilai hero. Tunggu "lanjut".

## Phase 5: Motif jembatan dan ritme halaman

1. `solution.tsx`: hubungkan kartu-kartu lowongan ke kartu "Keahlian Terangkum" dengan garis konektor SVG tipis (`--sb-mist`/`--sb-blue`, `stroke-linecap: round`), gaya diagram node. Pertahankan animasi penyatuan yang sudah ada; jangan menambah animasi.
2. Skill yang belum ada = "papan bolong": chip border putus-putus `--sb-warning` + latar `--sb-warning-soft` + teks "Belum ditemukan". Terapkan konsisten di hero, solusi, dan `skill-chips.tsx` (varian baru).
3. `how-it-works.tsx`: ganti ilustrasi skeleton abu-abu dengan mini-UI nyata (komponen asli diperkecil): 1) CV terbaca + chip skill, 2) daftar skill lowongan dengan centang dan "Belum ditemukan", 3) checklist rencana belajar.
4. Ritme: jadikan SATU section (`how-it-works` atau `stats-strip`) berlatar `--sb-navy` dengan teks putih dan aksen `--sb-sky`; kontras teks putih di atas navy harus lolos. Section lain: kurangi gradasi, bergantian putih dan `--sb-mist-faint`.
5. `trust.tsx`: kalimat SDG 8 & 10 ("Informasi soal skill yang dicari seharusnya bisa didapat siapa pun...") dibuat lebih menonjol secara visual (ukuran dan penempatan), copy tidak berubah. Ini mendukung penilaian Kesesuaian Tema.
6. Update `/design-system`: varian chip "belum ditemukan", kartu "Contoh hasil", tombol primary/secondary baru, dan ringkasan token status baru.
7. Lint + typecheck. **STOP**, minta pengguna menilai seluruh landing dan `/design-system`. Tunggu "lanjut".

## Phase 6: QA final (tetap tanpa commit)

1. Screenshot ulang `/`, `/lowongan`, `/tren-skill`, `/design-system` di 1440 dan 390 ke `docs/redesign/visual-upgrade/after-*.png`; sajikan perbandingan dengan baseline.
2. Cek: tidak ada overflow horizontal di 360-390px, kontras AA (laporkan rasio tombol primary dan teks body), fokus keyboard terlihat, scene dekoratif diberi `aria-hidden` (atau `role="img"` + `aria-label` singkat), tidak ada teks < 12px, reduced-motion bekerja, dan animasi berhenti saat hero di luar layar.
3. Alur tetap jalan: landing → register/login → demo → `/lowongan` → `/tren-skill`.
4. `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` semua lulus. Jalankan `npm run dead` dan `npm run dup` dan laporkan hasilnya.
5. Tulis `docs/redesign/visual-upgrade/README.md` (maks 1 halaman): perubahan per phase, 3 pengecualian aturan yang diambil, dan hal yang belum sempurna. Jangan stage file ini.
6. Laporan akhir: `git status --short` dan `git diff --stat`, ingatkan bahwa semuanya masih uncommitted di branch `feat/visual-upgrade`, dan biarkan dev server tetap menyala. Jangan commit, jangan merge.
