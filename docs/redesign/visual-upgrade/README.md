# SkillBridge — visual upgrade

> Revisi terbaru mengikuti feedback pengguna: scene jembatan diganti satu pratinjau hasil analisis CV (`hero-analysis-preview.tsx`). SweetAlert2 ditambahkan atas permintaan pengguna untuk seluruh konfirmasi native; target belajar menjadi accordion dengan urutan dan perpindahan prioritas. Shell halaman dipertahankan saat pemuatan konteks, session request dideduplikasi, dan loading skeleton ditambahkan. Lint, build webpack, dan 58 tes lulus. Uji UI dilakukan memakai fixture lokal yang sudah dihapus; tombol prioritas, draft catatan, simpan, batal, dan hapus lokal teruji. Drag mouse belum diuji end-to-end. Screenshot terbaru: [hero](hero-analysis-desktop.jpg), [SweetAlert](sweetalert-confirm.jpg), [belajar mobile](learning-collapsed-mobile.jpg). Bagian di bawah merekam iterasi visual sebelumnya, bukan desain hero terkini. Tidak ada commit/push.

Branch `feat/visual-upgrade`; seluruh perubahan masih uncommitted. Server yang sudah ada tetap hidup di http://localhost:3001 (webpack). Tidak ada stage, commit, merge, push, dependency aplikasi baru, atau aset gambar baru; gambar dalam folder ini hanya screenshot QA.

## Perubahan per phase

- 0: audit komponen/token, cabang baru, baseline desktop/mobile. Urutan guest sebelumnya mengikuti respons API; jumlah bidang dihitung dari kategori tiap posting.
- 1: CTA lebih tegas, secondary ber-outline biru, teks sekunder lebih pekat, token status lembut.
- 2: statistik dari respons `/api/jobs`; angka bidang <10 disembunyikan. Guest default mengutamakan empat bidang inti lalu waktu pengambilan terbaru; pencarian/filter/pagination tetap tersedia.
- 3–4: scene SVG/HTML jembatan dengan tujuh ubin dan satu slot kosong; chip melengkapi jembatan dalam timeline CSS 9 detik. Label contoh, kartu hasil berupa hitungan, heading dua baris pada 1280px, parallax dan penghentian di luar layar dipertahankan. Komponen hero lama yang tak dipakai dihapus.
- 5: mini-UI tiga langkah, konektor solusi, chip dashed untuk gap, pernyataan akses informasi lebih menonjol, showcase komponen diperbarui; overflow demo spinner mobile diperbaiki.
- 6: screenshot dan QA pada 1440×900 dan 390×844; landing juga diperiksa 360px dan heading pada 1280px.

Tiga pengecualian brief: satu section statistik berlatar navy; satu timeline jembatan berulang; satu kartu hasil contoh memakai hitungan, bukan persentase. Copy utama dan urutan cerita dipertahankan.

## Validasi dan batasan

Lint, typecheck, build webpack, serta 58 tes lulus. Filter Produk & Desain dari halaman 2 mengembalikan halaman 1. Overflow halaman landing/lowongan/tren/showcase diperiksa; landing tidak memiliki teks di bawah 12px. Fokus CTA terlihat dan animasi terverifikasi paused setelah hero keluar layar. Reduced motion memiliki aturan statis CSS dan pemeriksaan di hook parallax; pergantian preferensi OS belum diuji langsung.

Kontras sRGB: primary navy/sky 5,92:1; putih/navy 12,12:1; teks sekunder pada putih 8,44:1, mist faint 8,09:1, mist soft 7,76:1. Baseline teks sekunder 4,89–5,18:1; tidak ada kegagalan pada tiga latar tersebut. Label status pada latar lembut menggunakan navy agar lolos AA.

`npm run dead`/`dup` awalnya gagal karena executable lokal tidak ada. Pemeriksaan sementara tanpa perubahan dependency: knip exit 1 (jscpd unused devDependency; jscpd/knip unlisted binaries), jscpd exit 0 (37 clones, 365 baris/1,29%). Tidak merapikan kode di luar scope untuk temuan ini. Warning middleware Next.js lama masih ada.

Registrasi saat ini menampilkan “Pendaftaran Ditutup”; halaman login tidak menyediakan tombol demo. Navigasi landing/login/register/lowongan/tren diperiksa, tetapi alur daftar/demo penuh tidak dapat diselesaikan tanpa mengubah auth yang dilarang brief. Tidak ada data produksi ditulis.

## Perbandingan screenshot

| Halaman | Sebelum 1440 / 390 | Sesudah 1440 / 390 |
|---|---|---|
| Landing | [desktop](before-landing-1440.jpg) / [mobile](before-landing-390.jpg) | [desktop](after-landing-1440.jpg) / [mobile](after-landing-390.jpg) |
| Lowongan | [desktop](before-lowongan-1440.jpg) / [mobile](before-lowongan-390.jpg) | [desktop](after-lowongan-1440.jpg) / [mobile](after-lowongan-390.jpg) |
| Tren | [desktop](before-tren-skill-1440.jpg) / [mobile](before-tren-skill-390.jpg) | [desktop](after-tren-skill-1440.jpg) / [mobile](after-tren-skill-390.jpg) |
| Design system | — | [desktop](after-design-system-1440.jpg) / [mobile](after-design-system-390.jpg) |

Screenshot memakai browser terhubung dan format JPEG asli, bukan CLI Playwright. Baseline awal melalui 127.0.0.1 mengalami pembatasan resource development dan tidak memuat data/interaksi lengkap; perbandingan baseline hanya untuk susunan visual. QA final memakai localhost dan data yang selesai dimuat.
