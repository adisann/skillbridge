# Prompt Revisi 7: Susun Ulang Landing Berdasarkan Story

Lanjutkan di SkillBridge (`web/`, dev di `localhost:3001`). Baca `AGENTS.md` dulu. Buat branch `feat/landing-story` dari `main`, commit per section, lalu merge lokal `--no-ff` setelah cek di bagian 5 lolos. **Jangan push.** Jangan commit file di `.agents/`. Ubah kode dengan tool edit file, dan jangan jalankan ulang dev server.

Acuan cerita ada di dokumen story SkillBridge (kerangka StoryBrand). Pahlawannya pencari kerja: mahasiswa tingkat akhir, fresh graduate, dan orang yang ingin pindah bidang. Musuhnya **tebak-tebakan**. SkillBridge hanya berperan sebagai **pemandu**.

---

## 0. Masalah nyata dari pengguna (jadi dasar copy)

Tiga keluhan ini datang langsung dari pencari kerja. Jadikan inti section "Masalah" dan "Solusi":

1. Setiap lowongan harus dibuka satu per satu hanya untuk tahu skill dan kriteria yang diminta.
2. Bingung menilai apakah dirinya layak atau belum untuk posisi itu.
3. Ditolak tanpa informasi apa pun. Lamaran di-ghosting.

**Aturan kejujuran:** SkillBridge tidak tahu alasan sebuah perusahaan menolak pelamar. Jangan pernah menulis "kami beri tahu kenapa kamu ditolak". Yang boleh dijanjikan: **tanpa harus menunggu kabar, kamu sudah bisa melihat skill apa yang belum terlihat di CV-mu.**

---

## 1. Kondisi kode sekarang

- `app/page.tsx` (±600 baris) berisi semua section dalam satu file: hero (baris ~166), Pilih bidang (~343), Cara kerja (~399), Kenapa SkillBridge (~507), dan CTA penutup (~558). Komponen `PixelArrow` ada di file yang sama.
- Copy hero ada di `lib/copy.ts` → `landing.heroHeadingLine1`, `heroHeadingLine2`, dan `heroSubheading`. Copy section lain masih ditulis langsung di JSX.
- Animasi yang **dipertahankan**: kartu mengambang (`.sb-float`), panah piksel naik (`.sb-arrow`, `PixelArrow`), parallax (`useParallax`), pause di luar viewport (`.hero-paused`), dan navbar transparan di puncak (`landing-sentinel`).
- Data kartu bidang memakai `JOB_CATEGORIES` dan `fetchDeduped`, dengan jumlah lowongan asli.

---

## 2. Refactor dulu (tanpa mengubah tampilan)

1. Pecah `app/page.tsx` menjadi komponen di `components/landing/`: `hero.tsx`, `problem.tsx`, `solution.tsx`, `how-it-works.tsx`, `fields.tsx`, `trust.tsx`, dan `closing.tsx`. Pindahkan juga `pixel-arrow.tsx`. `app/page.tsx` cukup merangkai section-section ini.
2. Semua teks landing dipindah ke `lib/copy.ts` → `landing.*`. Tidak boleh ada teks landing yang ditulis langsung di JSX.
3. Commit refactor ini terpisah (`refactor(landing): split sections and move copy`), lalu pastikan tampilannya identik dengan sebelum refactor.

---

## 3. Urutan baru landing

Alur cerita: **Hero → Masalah → Solusi (pemandu) → Cara kerja (rencana) → Pilih bidang (ajakan transisi) → Bisa dipercaya → Penutup (transformasi).**

### 3.1 Hero (hero + musuh)

- Judul: dua baris, masing-masing `block`.
  - Baris 1 (`--sb-navy`): `Melamar bukan`
  - Baris 2 (`--sb-blue`): `tebak-tebakan.`
- Subjudul: `Lihat skill dan kriteria dari banyak lowongan di bidangmu dalam satu tempat, lalu cek mana yang sudah ada di CV-mu sebelum melamar.`
- Tombol: `Mulai gratis` → `/register` (primary) dan `Lihat lowongan` → `/lowongan` (secondary).
- Visual kanan: tetap kartu bidang yang mengambang dan panah piksel. Kartu dibuat lebih "berbicara": setiap kartu bidang berisi nama bidang dan 4 chip skill. Tanpa angka, tanpa skor.
- Ukuran judul harus muat dua baris di layar 1280px ke atas. Di mobile pakai `text-wrap: balance`.

### 3.2 Masalah (section baru)

- Judul: `Cari kerja seharusnya tidak semelelahkan ini.`
- Tiga kartu berdampingan (satu kolom di mobile), masing-masing berisi ikon lucide, judul, dan satu kalimat:

| Ikon | Judul | Kalimat |
|---|---|---|
| `Files` | `Satu lowongan, satu kali baca` | `Kamu harus membuka lowongan satu per satu hanya untuk tahu skill dan kriteria yang diminta.` |
| `HelpCircle` | `Layak atau belum?` | `Daftar persyaratannya panjang. Sulit menilai sendiri apakah CV-mu sudah cukup.` |
| `MailX` | `Ditolak tanpa kabar` | `Lamaran tidak dibalas, dan kamu tidak tahu apa yang perlu diperbaiki.` |

- Penutup section (satu baris, `--sb-blue`, rata tengah): `Bukan kamu yang kurang berusaha. Informasinya saja yang tidak pernah sampai.`
- Latar section: putih. Kartu memakai border `--sb-border`, tanpa warna mencolok, karena section ini sengaja dibuat tenang.

### 3.3 Solusi: SkillBridge sebagai pemandu (section baru, menggantikan sebagian "Kenapa SkillBridge")

- Judul: `SkillBridge merangkumnya untukmu.`
- Tiga baris "sebelum → sesudah", dan setiap baris menjawab satu kartu masalah di atas, dengan urutan yang sama:

| Sebelum (teks `--sb-text-2`, dicoret tipis atau diberi ikon silang) | Sesudah (teks `--sb-navy`, ikon centang `--sb-blue`) |
|---|---|
| Membuka lowongan satu per satu | `Skill dan kriteria dari banyak lowongan dirangkum per bidang.` |
| Menebak apakah CV-mu cukup | `Unggah CV, lalu lihat skill mana yang sudah ada dan mana yang belum.` |
| Menunggu kabar yang tidak datang | `Tanpa menunggu kabar, kamu sudah tahu apa yang bisa disiapkan.` |

- Visual pendamping (kanan di desktop): ilustrasi abstrak, berupa beberapa kartu lowongan kecil yang "menyatu" menjadi satu kartu ringkasan berisi chip skill. Animasikan sekali saat masuk viewport: kartu bergeser ke tengah lalu menyatu, 600ms. **Tanpa angka, persentase, nama orang, atau skor.** Saat reduced-motion, tampilkan langsung dalam posisi akhir.

### 3.4 Cara kerja (rencana)

Pertahankan section yang ada. Rapikan copy-nya:
1. `Unggah CV` — `PDF atau Word. Periksa dan koreksi skill yang terbaca.`
2. `Lihat skill yang diminta` — `Bandingkan dengan lowongan asli di bidang yang kamu tuju.`
3. `Siapkan yang masih kurang` — `Simpan skill yang perlu dipelajari dan pantau lamaranmu.`

Judul section: `Tiga langkah, lalu kamu tahu harus mulai dari mana.`

### 3.5 Pilih bidang (ajakan transisi)

Pertahankan section dan datanya. Judul: `Mulai dari bidang yang kamu tuju.` Hapus subjudul "Bukan cuma data…". Kartu tetap menaut ke `/lowongan?bidang=<slug>` dengan jumlah lowongan asli.

### 3.6 Bisa dipercaya (ganti "Kenapa SkillBridge")

Buat lebih ringkas: satu baris berisi 3 poin dengan ikon, tanpa kartu besar.
- `Lowongan asli` — `Setiap lowongan menaut ke sumbernya.`
- `CV-mu privat` — `Disimpan aman dan bisa kamu hapus kapan saja.`
- `Gratis` — `Tanpa biaya untuk pencari kerja.`

Di bawahnya satu kalimat (`--sb-text-2`, rata tengah), yang terkait SDG 8 & 10: `Informasi soal skill yang dicari seharusnya bisa didapat siapa pun, bukan hanya yang punya orang dalam.`

### 3.7 Penutup (transformasi)

- Judul: `Jadi kandidat yang tahu apa yang kamu tawarkan.`
- Subjudul: `Mulai dari CV yang kamu punya sekarang.`
- Tombol: `Mulai gratis` dan `Coba akun demo`.
- Latar: `--sb-mist-soft` dengan motif piksel. Panah piksel boleh muncul lagi di sini dalam versi kecil sebagai penutup visual.

---

## 4. Aturan yang tetap berlaku

- Tidak ada eyebrow, skor, persentase kecocokan, data pribadi, atau testimoni karangan.
- Tidak ada subjudul pengisi yang hanya mengulang judul.
- Palet: navy dan `#005A9C` hanya untuk teks, ikon, dan garis. Tidak ada abu-abu.
- Ukuran teks minimal 12px. Ganti `text-[11px]` di kartu hero.
- Jarak antarsection konsisten (`py-20 sm:py-28`). Latar section bergantian putih dan `--sb-mist-faint` supaya ritmenya terasa.
- Jangan menambah animasi baru selain penyatuan kartu di section Solusi. Pembeda SkillBridge ada di cerita, bukan di jumlah efek.

---

## 5. Cek sebelum merge

1. `cd web && npm run lint && npm run build && npm test` lolos semua.
2. Urutan h2 di landing: Masalah → Solusi → Cara kerja → Pilih bidang → (Bisa dipercaya tanpa h2 besar) → Penutup.
3. Grep `components/landing` dan `app/page.tsx`: tidak ada teks Indonesia yang ditulis langsung di JSX (semua dari `copy.ts`), tidak ada `%`, `skor`, `text-[11px]`, maupun `text-[10px]`.
4. Uji `prefers-reduced-motion`: semua animasi diam, dan konten tetap tampil lengkap.
5. Screenshot landing penuh di 1440px dan 375px. Simpan di `docs/redesign/landing-story/`. Hapus folder screenshot revisi sebelumnya di `docs/redesign/` supaya tidak menumpuk.
