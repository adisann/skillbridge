# Verifikasi Glints, Gaji, dan IPK — 6 November 2026

## Hasil

**Status terbaru setelah pengguna menambahkan secret Actions:** migrasi kolom dan pengujian gaji produksi lulus; **10 lowongan Glints benar-benar tersimpan**, dua record `worker_runs` terkonfirmasi, dan batch kedua melewati 10 duplikat tanpa insert tambahan. API produksi sudah memuat seluruh 10 lowongan Glints. Percobaan awal yang gagal menyimpan tetap didokumentasikan di bawah sebagai riwayat temuan.

## Verifikasi ulang setelah secret ditambahkan

API GitHub mengonfirmasi nama `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` tersedia sebagai repository Actions secrets. Pengguna menambahkannya sendiri; agen tidak membaca nilai secret dari GitHub atau mengirim ulang key lokal.

| Hasil | Run penyimpanan | Run deduplikasi |
|---|---|---|
| GitHub Actions | [42078905142](https://github.com/adisann/invofest-2026/actions/runs/42078905142) | [42079255028](https://github.com/adisann/invofest-2026/actions/runs/42079255028) |
| Status akhir Actions | completed / success | completed / success |
| `worker_runs.id` | `a9779014-24ca-4420-afbf-dd8b68439d00` | `a2b46792-77ba-49e6-b9af-354b5ae78686` |
| Waktu pencatatan, 6 November WIB | 00:54:10 | 00:56:07 |
| Fetched / inserted / updated | 10 / 10 / 0 | 10 / 0 / 0 |
| Duplicate / failed | 0 / 0 | 10 / 0 |
| Status / error database | success / null | success / null |

Kedua run memakai SHA `0bde8d072f5ab0c2c3dec768e11ddeda6b0c9643`. Jumlah Glints tetap 10 dengan ID yang sama setelah run kedua. Delapan lowongan memiliki relasi skill dan tujuh mencantumkan gaji; dua tanpa skill tidak diberi skill rekaan. Seluruh lowongan publik Glints memiliki URL asli `https://glints.com/...` dan `retrieval_method=public_page`. Tidak ada IPK minimum pada sepuluh record ini, sehingga batch ini tidak membuktikan ekstraksi IPK dari persyaratan live.

Katalog `/api/jobs` akhirnya berubah dari 54 menjadi **64 record**, termasuk 10 Glints; cache sempat menampilkan katalog lama sebelum diperbarui otomatis. Berikut snapshot terbaru `/api/insights` setelah penyimpanan:

| Filter | N sebelum → sesudah | Bukti |
|---|---|---|
| all | 42 → 52 | Microsoft Excel menjadi urutan pertama: 22/52, 42%; SQL 21/52, 40% |
| data-analitik | 28 → 29 | Tambahan satu record berasal dari salah klasifikasi Bioskop, lihat batasan |
| pemasaran | 1 → 2 | Tambahan supervisor marketing tanpa relasi skill; ranking teratas tetap seed, persentase menjadi 50% |
| keuangan | 2 → 3 | Skill Glints dari Tax & Accounting tampil: Financial Statements, Financial Report Audit, MYOB, Taxation, Tax Planning, Tax Accounting; Microsoft Excel 3/3 |
| lainnya | belum dicatat → 8 | Customer Service dan Cashier masing-masing 2/8; juga Healthcare, Pharmacy, dan skill non-data lain |

Ini membuktikan skill non-data Glints sudah ikut dalam endpoint Tren Skill, khususnya Keuangan dan Lainnya. Snapshot API setelah run tidak diuji ulang melalui klik filter browser; pengujian browser pada bagian historis di bawah dilakukan sebelum data Glints masuk.

**Masalah kualitas data yang masih terbuka:**

- `Helper / Serabutan Bioskop` tersimpan dengan canonical title `BI Analyst` karena `extract.py` menguji substring `"bi" in lower_title`. Record `e357fed4-db68-4016-9139-20f5248481b7` ikut meningkatkan N Data & Analitik secara keliru. Perbaiki parser dan record tersebut sebelum menganggap angka N=29 sebagai sampel data yang bersih.
- `Content Creator` tersimpan dengan title dan skill sumber yang benar, tetapi kategori web `lainnya`, bukan Pemasaran. Keyword kategori belum mencakup posisi ini. Record `52be3c99-5256-44a2-accd-149d1540dab5` memiliki Google Analytics, Content Marketing, TikTok, dan skill konten lainnya; skill tersebut belum masuk filter Pemasaran.
- `worker_runs.retrieval_method` masih `public_api` meskipun record lowongan Glints memakai `public_page`.
- Embedding tetap mock berdasarkan implementasi saat ini; berhasil menyimpan lowongan tidak membuktikan embedding semantik nyata.

Tidak mengubah parser, record hasil worker, kode web, atau deployment dalam verifikasi ulang ini. Temuan kategori dilaporkan apa adanya.

## Bukti yang terkonfirmasi

| Pemeriksaan | Hasil |
|---|---|
| Lokal dan GitHub `main` | `0bde8d072f5ab0c2c3dec768e11ddeda6b0c9643` |
| Dua file modified awal | `sidebar.tsx` dan `utils.ts` tidak berbeda isi pada `git diff --ignore-space-at-eol`; tidak diubah |
| REST `jobs` | HTTP 200 untuk `salary_min`, `salary_max`, `salary_currency`, `salary_period`, `min_gpa` |
| REST `resumes` | HTTP 200 untuk `gpa`; tidak mengambil teks CV |
| Sumber Glints | Terdaftar dan aktif di `job_sources` |
| Status commit Vercel di GitHub | `success`, deskripsi `Deployment has completed` |
| Admin produksi | Login berhasil, form menampilkan gaji minimum/maksimum, mata uang, dan periode |
| Tes lokal terkait gaji/IPK/matching | 29 lulus, 0 gagal |
| Tes worker di Actions | 22 lulus |

Status Vercel untuk commit tersebut: [deployment ARWokYQ5LbzbHsrwgGhPzXXYunMM](https://vercel.com/adisans-projects/skillbridge/ARWokYQ5LbzbHsrwgGhPzXXYunMM). Domain [produksi](https://skillbridge-three-chi.vercel.app) melayani fitur gaji yang diuji. Pemetaan alias domain ke SHA tersebut belum diverifikasi secara independen: tab Overview Vercel yang sudah terbuka menampilkan deployment lama dan tidak berhasil diperbarui ketika ada interaksi pengguna pada jendela yang sama. Nama dan cakupan environment variable Vercel, termasuk `LLAMA_CLOUD_API_KEY`, belum terverifikasi; keberadaan di file lokal bukan bukti keberadaan di Vercel.

Pemeriksaan REST membuktikan kolom dapat dibaca dan sumber tersedia, bukan audit seluruh constraint migrasi. Tidak menjalankan migrasi baru.

## Penyimpanan gaji di produksi

Pengujian memakai API aplikasi yang sudah di-deploy, sesi login admin normal, dan pembacaan kembali record Supabase. Ini menguji API produksi sampai database; form browser diperiksa keberadaannya, tetapi submit tambah/edit melalui browser tidak diuji.

Data berasal dari [lowongan Glints Teknisi Gedung & Outlet Spa](https://glints.com/id/en/opportunities/jobs/teknisi-gedung-and-outlet-spa-gaji-tetap-bpjs/7e0cfd8f-5cca-43b3-94c5-0a7a78f8d755), PT.Berkarya Dari Hati. Halaman publik berstatus `OPEN`, menampilkan gaji pokok IDR 4.000.000–5.000.000 per bulan. Deskripsi disalin dari sumber dan kontak disensor. Tidak memakai nominal rekaan.

Salinan uji dibuat melalui admin dengan ID `978ba74c-f46a-46a0-a71b-bdeea1013947`, kemudian dibersihkan setelah pengujian.

| Skenario | HTTP | Hasil database |
|---|---|---|
| Tambah dengan gaji sumber asli | 200 | 4.000.000–5.000.000, IDR, month |
| Edit menjadi hanya batas maksimum | 200 | minimum null, maksimum 5.000.000 |
| Update request lama tanpa field gaji | 200 | Gaji sebelumnya tetap |
| Kosongkan kedua nominal | 200 | Keempat field gaji null |
| Minimum negatif | 400 | Ditolak |
| Minimum pecahan | 400 | Ditolak |
| Minimum melebihi maksimum | 400 | Ditolak |
| Kembalikan gaji sumber asli | 200 | 4.000.000–5.000.000, IDR, month |
| Baca katalog produksi | 200 | Salinan tampil dengan gaji yang sesuai |
| Hapus hanya salinan uji | 200 | Record sudah tidak ada |

Setelah pembersihan, himpunan seluruh ID lowongan persis sama dengan sebelum uji: **54 record**. Tidak mengubah lowongan awal. Uji tidak menambahkan skill baru. Duplikasi dan mata uang non-IDR tercakup tes lokal; tidak diuji sebagai operasi tersimpan di produksi.

Perintah tes lokal dari folder `web`:

```powershell
node --experimental-strip-types --test tests/admin-salary.test.ts tests/salary.test.ts tests/gpa.test.ts tests/matching.test.ts
```

Ada peringatan Node `MODULE_TYPELESS_PACKAGE_JSON`; seluruh 29 tes tetap lulus. Build dan lint tidak diulang karena tidak ada perubahan kode aplikasi pada sesi verifikasi ini.

## Kegagalan penyimpanan Glints — percobaan awal

[Run 42075444828](https://github.com/adisann/invofest-2026/actions/runs/42075444828) dipicu dengan `source=glints`, `limit=10`, ref `main`. Mulai 6 November 2026 pukul 00:31:27 WIB dan selesai sekitar 00:32:28 WIB. SHA run sesuai commit lokal.

Log menunjukkan:

- Sitemap dan halaman publik Glints merespons HTTP 200.
- Parser menghasilkan 10 lowongan valid, antara lain Crew Outlet, Fisioterapis, Barista, Digital Marketing B2B mesin laser, Sales Manager, dan Teknisi Gedung & Outlet Spa.
- Storage melaporkan konfigurasi Supabase tidak tersedia dan masuk dry-run/mock.
- Embedding memakai `MockEmbeddingProvider`.
- Angka `inserted_count=10` dan pesan audit hanya tercetak ke log; ini **bukan bukti insert database**.

Pembacaan Supabase sebelum dan sesudah run: `jobs` untuk `source_name=glints` kosong dan `worker_runs` untuk Glints kosong. API GitHub mengembalikan daftar repository Actions secrets dan variables kosong. Tidak menjalankan run kedua karena persistence belum berfungsi; deduplikasi lintas run belum dapat dibuktikan.

Pada percobaan awal, pemasangan secret oleh agen belum dilakukan. Peninjauan persetujuan otomatis menolak pengiriman service-role key lokal ke GitHub karena belum ada izin eksplisit untuk mengirim credential tersebut ke repository. Tidak mencoba jalur pengiriman lain. Pengguna kemudian memasang secret secara manual, dan hasil verifikasi ulang ada pada bagian teratas.

Tindakan yang saat itu disiapkan untuk persetujuan adalah pemasangan dua secret tersebut pada `adisann/invofest-2026`. Key memberi workflow akses istimewa ke database. Agen tidak membuat key baru atau mencetak nilainya; tidak perlu melakukan pengiriman lagi setelah pemasangan manual pengguna.

## Tren Skill non-data — snapshot sebelum Glints tersimpan

Pembacaan endpoint produksi memberikan snapshot berikut:

| Filter `bidang` | N | Contoh ranking |
|---|---:|---|
| all | 42 | SQL, Microsoft Excel, Power BI |
| data-analitik | 28 | SQL, Power BI, Microsoft Excel |
| pemasaran | 1 | SEO, Google Ads, Google Analytics |
| produk-desain | 1 | Figma, UI Design, UX Research |
| keuangan | 2 | Microsoft Excel, Financial Modeling, Financial Reporting |
| operasional | 0 | Kosong |

Pada browser produksi, memilih Pemasaran Digital dari panel Filter lalu Terapkan Filter mengubah tampilan dari N=42/ranking SQL menjadi N=1/ranking SEO, Google Ads, dan Google Analytics. Status skill tetap berbentuk teks. Parameter `bidang` pada URL halaman sendiri tidak menginisialisasi filter UI; pengujian browser memakai kontrol Filter. Endpoint `/api/insights` menerima parameter tersebut.

**Batasan asal data:** Digital Marketing Specialist dan UI/UX Designer pada katalog memiliki `retrieval_method=seed` dan URL sumber `seed-mkt-01`/`seed-ux-01`, meskipun `sourceName=jobstreet`. Ini membuktikan tampilan dan filter bekerja, bukan membuktikan crawling live non-data. Keuangan mencakup satu seed dan satu record `jobspy`; URL `jobspy` tidak diverifikasi ke sumber aslinya dalam sesi ini. Data seed tidak boleh dipresentasikan sebagai bukti pasar live terverifikasi.

Hasil `/api/jobs?bidang=produk-desain` memuat dua posisi pada pembacaan berikutnya, sementara snapshot insights sebelumnya N=1. Konsistensi katalog/insights setelah cache diperbarui masih perlu diperiksa. Katalog server memakai cache 900 detik dan endpoint publik memakai cache CDN; jangan menyimpulkan penyebab hanya dari dua snapshot berbeda waktu.

## Pekerjaan tersisa

1. Perbaiki salah klasifikasi Bioskop → BI Analyst dan Content Creator → Lainnya, termasuk koreksi record terdampak, lalu ulangi pemeriksaan N/ranking.
2. Perbaiki pelaporan worker: konfigurasi database kosong harus menggagalkan workflow; kegagalan simpan/log tidak boleh terlihat sukses. Samakan metadata `worker_runs` Glints dengan metode `public_page`.
3. Implementasikan provider embedding nyata sebelum mengklaim pencarian semantik. Kode `embed.py` tetap mengembalikan provider mock meskipun AI key tersedia; jangan mengirim AI key hanya untuk mengaktifkan cabang mock tersebut.
4. Pisahkan atau beri label data seed secara jelas, cocokkan semua filter yang tampil dengan parameter yang benar-benar dipakai insights, dan periksa konsistensi cache. Agregasi saat ini berada di TypeScript `public-jobs.ts`, belum SQL seperti acuan AGENTS.md.
5. Verifikasi metadata env Production/Preview dan deployment aktif Vercel tanpa membuka nilai secret. Form admin IPK minimum belum ada.
6. Bahas [rencana profil](rencana-profil-cv-2026-11-06.md) sebelum implementasi besar.

Sesi ini tidak mengubah kode aplikasi, workflow, migrasi, secret, atau deployment. Dua file modified awal tetap dipertahankan. Penambahan repository hanya laporan ini dan rencana profil.
