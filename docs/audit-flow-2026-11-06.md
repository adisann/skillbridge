# Audit Flow SkillBridge — 6 November 2026

## Hasil utama

Audit belum lulus untuk keseluruhan alur. Navigasi, login demo/normal, pembacaan CV, katalog/detail lowongan, dan pembacaan Tren Skill berjalan, tetapi ada dua masalah akses/file yang harus diprioritaskan, serta celah pada registrasi, ekstraksi CV, konsistensi filter, dan tampilan mobile.

Kode yang diperiksa adalah isi `main` dengan lima commit, HEAD `e8f4579`. Dua branch lokal `backup/before-squash-20261106` dan `backup/before-strip-claude` sudah dihapus setelah tree masing-masing terbukti identik dengan tree akhir `main`. Branch fitur, perubahan lokal, dan dua dokumen yang sebelumnya belum di-commit dipertahankan.

## Cakupan dan metode

- Menjalankan build produksi lokal yang tersedia pada port 3002; sumbernya identik dengan isi `main` saat audit.
- Memeriksa browser pada viewport 1440×900 dan 375×812, navigasi tamu, akun demo juri, dan login admin normal.
- Memeriksa GET API memakai sesi/token demo normal; normal user ditolak API admin dengan HTTP 403 dan tamu ditolak dengan HTTP 401.
- Memverifikasi masalah cookie melalui GET read-only lokal dengan cookie tanpa token Supabase sah. Tidak mengubah data untuk pembuktian ini.
- Menguji failure path handler upload/hapus melalui dependency stub lokal. Tidak mengunggah berkas atau menghapus objek R2 sungguhan untuk pengujian tersebut.
- `npm run lint` lulus. Validasi sebelumnya pada isi kode yang sama: 47 tes web lulus; 27 tes worker di Actions lulus; build Webpack dan TypeScript lulus. Build Turbopack lokal sebelumnya gagal saat menjalankan proses anak. Angka tes tersebut bukan bukti semua flow browser atau seluruh operasi database sudah lulus.
- Acuan UI: [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), terutama label form, filter/state navigasi, dan overflow layout; pemeriksaan Next.js/React mengikuti skill proyek.

## Temuan prioritas

### P1 — Cookie tanpa bukti autentikasi dapat membuka akses admin

`web/src/lib/supabase/server.ts:67` membaca `sb_user_session` sebagai JSON dan menganggap `userId` valid hanya karena ada di tabel `profiles`. Tidak ada verifikasi tanda tangan atau kepemilikan sesi ketika fallback tersebut dipakai. Flag HttpOnly pada cookie yang diterbitkan aplikasi tidak membuat isi cookie yang diterima server menjadi tepercaya.

Pembuktian read-only pada build lokal, tanpa login dan tanpa token Supabase:

| Request | Tanpa cookie | Dengan cookie sesi buatan |
|---|---|---|
| GET `/api/me` | user null | user dengan role admin |
| GET `/api/admin/skills` | 401 | 200, 212 skill |
| GET `/api/admin/worker-runs` | 401 | 200, 20 riwayat |

Normal token juri tetap ditolak HTTP 403; perlindungan normal ini tidak menutup jalur fallback. Prioritas perbaikan: autentikasi server harus bergantung pada sesi Supabase sah, bukan keberadaan ID pada cookie JSON. Middleware (`web/src/middleware.ts:8`) juga hanya memeriksa keberadaan/bentuk cookie, sehingga bukan lapisan pembuktian autentikasi.

Tambahan dari pembacaan sumber yang belum diuji sebagai perubahan akses live: `getAuthenticatedAdmin()` menerima `user_metadata.role` pada `web/src/lib/supabase/server.ts:135`, dan policy update `profiles` pada migrasi awal tidak membatasi kolom `role`. Keduanya perlu ditinjau bersama perlindungan role yang dikendalikan server. Uji perubahan role nyata tidak dijalankan.

### P1 — Penghapusan CV menerima object key dari klien tanpa verifikasi kepemilikan

`web/src/app/api/cv/delete/route.ts:21` langsung memakai `r2Key` dari body. Lookup resume milik pengguna hanya dilakukan jika key tidak diberikan. `deleteFromR2()` kemudian dipanggil sebelum ada pembuktian bahwa key tersebut terkait resume pemilik sesi.

Dalam uji handler lokal, key fixture yang diberi label milik pengguna lain tetap diteruskan ke fungsi hapus. Ini membuktikan tidak adanya pemeriksaan kepemilikan pada jalur tersebut, bukan bukti bahwa file pengguna lain benar-benar dihapus; dependency R2 dimock dan tidak ada objek produksi yang disentuh.

Fungsi hapus juga tetap menjawab HTTP 200 dan pesan seluruh data/file berhasil dihapus ketika dependency `deleteFromR2()` mengembalikan `false`. Nilai balik pada `web/src/app/api/cv/delete/route.ts:42` diabaikan.

Perbaikan perlu mengambil key dari resume yang telah dibuktikan kepemilikannya di server dan menangani kegagalan file/database secara jujur. Jangan mengubah ini hanya pada UI.

### P2 — Upload CV dapat berhasil dengan dokumen rusak atau hasil ekstraksi rekaan

Lokasi: `web/src/app/api/cv/upload/route.ts:88`, `:97`, `:179`, `:206`; `web/src/lib/r2.ts:65`.

Hasil uji handler lokal dengan dependency terkontrol:

| Kondisi | Hasil aktual |
|---|---|
| Parser PDF melempar error untuk fixture berawalan `%PDF-` | Bytes dijadikan UTF-8; HTTP 200, success true, penyimpanan tetap dipanggil |
| Teks hanya menyebut `Bachelor of Data Science` | Pendidikan menjadi `S1 Data Science (Telkom University)` meskipun institusi tidak ada dalam teks |
| Teks menyebut internship tanpa durasi | Pengalaman menjadi 1 tahun |
| Helper penyimpanan mengembalikan URL kosong | HTTP 200 dan success true dengan `fileUrl` kosong |

Checkbox persetujuan tersedia pada UI dan menahan pemilihan file sebelum dicentang; route upload sendiri tidak membaca field persetujuan. LlamaParse belum digunakan oleh jalur upload CV ini. Profil otomatis lengkap masih berupa rencana, bukan fitur yang selesai.

### P2 — Registrasi belum menangani konfirmasi email

`web/src/lib/supabase/auth-context.tsx:167` melakukan `signUp()`, kemudian langsung memanggil `login()` ketika `data.user` tersedia (`:185`). Konfigurasi Supabase yang dibaca saat audit memberikan `mailer_autoconfirm=false`.

Kode belum memiliki cabang untuk akun yang berhasil dibuat tetapi belum mempunyai sesi karena menunggu konfirmasi email. UI registrasi memperlakukan hasil login gagal sebagai pendaftaran gagal. Perlu membedakan status akun dibuat/menunggu verifikasi dari kegagalan pembuatan akun.

Form registrasi dibuka dan pemeriksaan atribut input dilakukan. Tidak mengirim formulir pendaftaran sungguhan atau email dalam audit ini; temuan berdasarkan alur kode dan konfigurasi auth yang dibaca.

### P2 — Filter dan kelanjutan Lowongan → Tren Skill tidak konsisten

- Dari Lowongan dengan bidang Pemasaran, tautan `Tren skill di bidang ini` menuju `/tren-skill?bidang=pemasaran`, tetapi halaman menampilkan `Bidang: Seluruh Posisi`, N=61. `web/src/components/insights/skill-trends.tsx:35` selalu menginisialisasi role `all` dan tidak membaca parameter URL.
- Filter gaji, jenis kontrak, dan pengalaman tampil pada UI Tren Skill, tetapi tidak disertakan oleh `web/src/lib/hooks/use-skill-insights.ts:8`. Route `web/src/app/api/insights/route.ts` juga tidak mengolah ketiga filter tersebut.
- Dalam browser, memilih `Gaji dicantumkan` mengubah chip filter tetapi tetap menampilkan N=61 dan ranking/persentase yang sama. Tidak ada query baru yang mewakili filter gaji.
- Di Job Explorer, daftar kategori dihitung dari daftar yang sudah dibatasi role (`web/src/components/jobs/job-explorer.tsx:60` dan `web/src/lib/hooks/use-job-feed.ts:27`). Setelah Data & Analitik dipilih, dropdown hanya menawarkan Semua Bidang dan Data & Analitik, sehingga pengguna harus menghapus filter lebih dahulu untuk pindah ke bidang lain.

Filter role pada endpoint insights sendiri berjalan. Snapshot lokal: Data & Analitik N=29, Pemasaran N=4, Keuangan N=3, Lainnya N=15; ranking berbeda sesuai role.

### P2 — Status skill manual hilang pada round trip koreksi CV

`web/src/app/api/cv/save/route.ts:223` hanya mengembalikan nama skill, tanpa `is_claimed_by_user`/daftar skill manual. `web/src/app/cv/page.tsx:60` memulai `manualSkills=[]`, dan pembacaan CV tersimpan tidak memulihkannya. POST berikutnya menulis `is_claimed_by_user` dari daftar tersebut (`web/src/app/api/cv/save/route.ts:122`).

Akibat alur kode ini, skill manual yang dimuat ulang lalu disimpan dapat kehilangan label klaim mandiri. Perlu mempertahankan asal/status skill pada GET, state form, dan POST. Round trip simpan sungguhan belum dijalankan karena pengujian tulis produksi tertahan.

### P2 — Form admin masih membatasi role dan tombol sinkronisasi belum menjalankan pipeline worker

`web/src/lib/admin-jobs.ts:21` menyediakan hanya Data Analyst dan BI Analyst. Browser mengonfirmasi dua pilihan tersebut pada form tambah manual; form edit memakai komponen yang sama. Input IPK minimum belum ada.

`web/src/app/api/admin/worker-runs/route.ts:49` hanya mengambil daftar Greenhouse/Lever untuk menghitung angka, sedangkan sumber lain memakai total record/seed (`:110`). Route menulis `worker_runs` tanpa melakukan pipeline upsert lowongan atau dispatch GitHub Actions, tetapi mengembalikan pesan worker berhasil dipicu (`:147`). UI menyebut tombol ini pemicu live crawler. Tombol tidak ditekan dalam audit agar tidak menambah log yang menyesatkan.

Workflow Python di GitHub Actions adalah jalur berbeda dan sebelumnya sudah dibuktikan berhasil: 21 lowongan Glints tersimpan, 11 record terbaru memiliki embedding Gemini 768 dimensi, dan run deduplikasi sebelumnya melewati 10 duplikat. Keberhasilan Actions tidak membuktikan tombol admin menjalankan pipeline yang sama.

### P2 — Footer CV melebar di mobile; beberapa field tidak memiliki label yang terhubung

Pada viewport 375×812, lebar area isi efektif 360px sementara `scrollWidth` halaman CV mencapai 452px. Tombol `Buka Job Explorer` mempunyai batas kanan sekitar 452px. Lokasi utama: `web/src/app/cv/page.tsx:602`, dua CTA berlebar penuh tetap berada dalam satu baris flex.

Pemeriksaan DOM juga menemukan field pendidikan, pengalaman, ringkasan, dan tambah skill tanpa associated label/aria-label. Label visual saja belum menautkan input. Lokasi pendidikan/pengalaman/ringkasan: `web/src/app/cv/page.tsx:412`, `:462`, `:484`.

Overflow mobile tambahan: Tracker sekitar 4px dan Design System sekitar 34px. Pada pemeriksaan desktop, halaman dashboard, lowongan, insights, progress, tracker, profil, dan design system tidak melebar keluar viewport.

## Ringkasan pemeriksaan flow

| Flow | Hasil | Batas verifikasi |
|---|---|---|
| Landing → Lowongan berdasarkan bidang | Berjalan | Pemasaran menampilkan 4 lowongan lokal; sumber dan gaji terlihat |
| Login demo juri 1 klik | Berjalan | Dashboard terisi, 7 skill CV terbaca |
| Login admin dan logout | Berjalan pada jalur normal | Autentikasi tetap memiliki celah cookie pada temuan P1 |
| Tamu membuka rute privat | Dialihkan ke login | API privat tanpa sesi menghasilkan 401 |
| Juri membuka admin | Ditolak | API 403 dan UI menampilkan halaman tidak ditemukan |
| Registrasi | Form diperiksa; belum lulus end-to-end | Tidak membuat akun baru/mengirim email; cabang verifikasi email belum ditangani |
| Upload/koreksi/hapus CV | Review CV dapat dibuka; failure path bermasalah | Operasi produksi baru tidak dijalankan; bukti failure path dari handler lokal |
| Job Explorer dan detail | Pembacaan berjalan | API akun juri menghasilkan Match, Underqualified, dan Insufficient evidence; detail akun tanpa CV menampilkan “Belum ada skor”, gaji, deadline, dan tautan sumber |
| Peragaan dua CV berbeda | Belum diuji live pada audit ini | Tes matching sebelumnya lulus; bukan bukti dua upload baru di UI |
| Tren Skill | Query role bekerja; kelanjutan/filter tambahan bermasalah | Status CV berupa teks; N dan ranking dibaca dari API lokal |
| Simpan lowongan dan rencana belajar | GET dan empty state berjalan | Uji tambah/ubah/hapus baru di produksi belum diizinkan |
| Tracker | Halaman dan navigasi terbuka | Tahap/catatan lokal belum diuji mutasi; bukan bukti sinkronisasi antarperangkat |
| Profil | Target kerja dan ringkasan dapat dibuka | Profil lengkap dari PDF masih rencana; perubahan target tidak disimpan dalam audit |
| Admin katalog/taksonomi/monitoring | UI dan pembacaan terbuka | Form gaji terlihat; tambah/edit gaji sudah diuji pada sesi sebelumnya; tidak diulang sebagai mutation test dalam audit ini |
| Asisten AI | Panel, konteks lowongan, dan tombol kirim kosong diperiksa | Tidak mengirim pertanyaan baru atau menguji jawaban model/cache dalam audit ini |
| Design System | Dibuka pada desktop/mobile | Ada overflow mobile kecil; bukan bukti seluruh kombinasi komponen aksesibel |

## Perbedaan lokal dan produksi

Pada pembacaan audit, `/api/jobs?q=Content%20Creator` di lokal mengembalikan kategori `pemasaran`, sedangkan domain produksi `https://skillbridge-three-chi.vercel.app` masih mengembalikan `lainnya`. Jadi hasil kode lokal tidak boleh dianggap otomatis sudah berlaku di Vercel. Deployment aktif dan koneksi Git Vercel tetap perlu diselesaikan sebelum pemeriksaan produksi akhir.

## Pengujian yang tertahan

Peninjauan persetujuan otomatis menolak rencana membuat akun Supabase sementara, mengunggah CV fixture, mengubah data dan role akun tersebut, kemudian membersihkan file/akun, karena efek samping produksi itu belum diizinkan secara eksplisit. Perintah ditolak sebelum dijalankan; tidak ada akun atau file uji yang dibuat oleh rencana tersebut. Tidak mencoba jalur lain untuk melakukan perubahan produksi yang sama.

Untuk melengkapi uji normal simpan/hapus, diperlukan izin membuat satu akun uji tanpa email, mengunggah CV dummy, menyimpan/menghapus lowongan dan target belajar milik akun uji, lalu menghapus hanya akun dan file uji itu. Uji perubahan role tidak diperlukan untuk menindaklanjuti dua masalah P1 yang sudah dibuktikan melalui read-only/handler lokal.

Prioritas tindak lanjut: tutup celah sesi dan kepemilikan file terlebih dahulu; perbaiki kejujuran hasil ekstraksi/penyimpanan; selesaikan verifikasi email dan filter; rapikan footer CV/label; baru lakukan uji tulis dengan akun terisolasi setelah mendapat izin. Migrasi Supabase tetap disiapkan sebagai file SQL untuk dijalankan pengguna sesuai preferensi yang sudah disampaikan.

Audit ini hanya menghapus dua ref backup Git yang diminta dan menambahkan laporan ini. Tidak mengubah kode aplikasi atau menjalankan migrasi, dispatch worker, maupun deployment baru.
