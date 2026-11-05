# **SKILLBRIDGE**

Dokumen User Requirements \| Versi 1.0 \| 2 November 2026

Web pencarian lowongan kerja berbasis kecocokan kompetensi dan analisis kebutuhan skill pasar kerja.

# **1\. Ringkasan Produk**

SkillBridge membantu pencari kerja memahami tiga hal: lowongan mana yang relevan terhadap CV mereka, keterampilan apa yang belum terbukti dimiliki, dan keterampilan apa yang paling sering diminta pada lowongan untuk peran tertentu. Platform menggabungkan katalog lowongan, analisis CV, pencocokan persyaratan, serta agregasi skill pada kumpulan lowongan yang tersedia.

Konteks lomba: INVOFEST 2026, subtema Digital Economy & Sociopreneurship (SDG 8 & 10). Dokumen ini adalah rancangan kebutuhan produk, bukan klaim bahwa sumber lowongan atau hasil model sudah tersedia.

# **2\. Masalah dan Tujuan**

* Pelamar harus membaca banyak deskripsi lowongan secara manual sebelum mengetahui tingkat kecocokan mereka.  
* Pelamar tidak mudah membedakan persyaratan wajib, keterampilan tambahan, dan kompetensi yang belum tercantum pada CV.  
* Pelamar kesulitan menentukan prioritas belajar berdasarkan pola kebutuhan nyata dari kumpulan lowongan target.  
* Tujuan: membantu pelamar menentukan lowongan prioritas dan menyusun rencana peningkatan skill yang dapat dijelaskan.

# **3\. Pengguna dan Kebutuhan Utama**

| Pengguna | Kebutuhan utama | Keberhasilan pengguna |
| :---- | :---- | :---- |
| **Mahasiswa / fresh graduate** | Unggah CV, cari entry-level role, lihat gap skill | Dapat shortlist lowongan dan top skill untuk dipelajari |
| **Pencari kerja berpengalaman** | Bandingkan CV dengan persyaratan dan senioritas | Memahami faktor match dan kemungkinan overqualification |
| **Admin konten (internal)** | Kelola lowongan, normalisasi skill, cek sumber data | Lowongan dapat ditelusuri dan diperbarui |

# **4\. Alur Pengguna Utama**

1\. Pengguna membuka website dan memilih role target, misalnya Data Analyst. 2\. Pengguna masuk atau membuat akun (opsional dalam mode demo). 3\. Pengguna mengunggah CV PDF atau DOCX dan meninjau hasil ekstraksi. 4\. Pengguna mencari atau memfilter lowongan. 5\. Website menampilkan estimasi kecocokan dan alasan per lowongan. 6\. Pengguna membuka detail gap skill dan rekomendasi tindak lanjut. 7\. Pengguna membuka halaman Market Skill Insights untuk melihat top skill dalam kumpulan lowongan yang tersaring. 8\. Pengguna menyimpan lowongan dan menandai progres belajar.

# **5\. Kebutuhan Fungsional**

| ID | Kebutuhan pengguna | Prioritas |
| :---- | :---- | :---- |
| **FR-01** | Sebagai pelamar, saya dapat menentukan role target dan lokasi/tipe kerja untuk mempersempit lowongan. | Must |
| **FR-02** | Saya dapat mengunggah CV dan mengoreksi skill, pengalaman, pendidikan yang berhasil diekstrak sebelum dianalisis. | Must |
| **FR-03** | Saya dapat melihat daftar lowongan berikut judul, perusahaan, lokasi, level, dan sumbernya. | Must |
| **FR-04** | Saya dapat memfilter berdasarkan role, lokasi, tipe kerja, senioritas, dan tanggal jika datanya ada. | Must |
| **FR-05** | Saya dapat melihat skor kesesuaian, kategori indikatif, serta penjelasan faktor yang mendukung dan mengurangi kecocokan. | Must |
| **FR-06** | Saya dapat melihat daftar persyaratan yang terbukti cocok, belum ditemukan di CV, dan tidak cukup informasi. | Must |
| **FR-07** | Saya dapat melihat top skill untuk role dan filter terpilih berdasarkan frekuensi kemunculannya di lowongan. | Must |
| **FR-08** | Saya dapat membandingkan top skill pasar dengan skill yang ditemukan di CV melalui penanda visual. | Must |
| **FR-09** | Saya dapat melihat prioritas pengembangan skill berdasarkan frekuensi pasar dan kesenjangan CV. | Should |
| **FR-10** | Saya dapat menyimpan lowongan, mengakses kembali analisis, dan mencatat progres belajar. | Should |
| **FR-11** | Saya dapat membuka detail bukti sumber, jumlah lowongan, dan waktu pembaruan analisis tren. | Should |
| **FR-12** | Admin dapat mengimpor, mengedit, menghapus, dan menduplikasi data lowongan. | Must |

# **6\. Aturan Analisis dan Definisi Status**

Skor kecocokan merupakan estimasi transparan, bukan probabilitas diterima kerja. Komponen yang diusulkan meliputi persyaratan skill wajib, skill tambahan, kesesuaian pengalaman, dan pendidikan jika relevan. Bobot serta ambang kategori harus dapat dikonfigurasi dan diuji dengan contoh kasus.

| Status | Makna operasional | Catatan |
| :---- | :---- | :---- |
| **Match** | Sebagian besar persyaratan utama terpenuhi berdasarkan informasi CV. | Tidak menjamin hasil rekrutmen. |
| **Underqualified** | Ada kekurangan signifikan pada persyaratan wajib atau pengalaman yang diminta. | Tampilkan gap yang spesifik. |
| **Potentially overqualified** | Pengalaman/senioritas tampak melampaui level lowongan. | Bukan penilaian negatif otomatis; tampilkan sebagai indikasi. |
| **Insufficient evidence** | CV tidak menyediakan bukti memadai untuk mengambil kesimpulan. | Jangan samakan tidak tertulis dengan tidak mampu. |

Contoh: pada lowongan Data Analyst yang mensyaratkan SQL, Excel, visualisasi data, komunikasi, dan pengalaman satu tahun, indikator masing-masing harus memperlihatkan sumber bukti dari CV atau status “belum ditemukan”.

# **7\. Analisis Top Skills dan Prioritas Belajar**

Pengguna memilih peran dan filter lowongan. Sistem mengekstrak skill dari persyaratan, menyatukan sinonim (misalnya PostgreSQL terkait SQL, tetapi tidak identik), lalu menghitung jumlah dan persentase lowongan yang menyebut setiap skill. Istilah harus dinormalisasi dengan kamus skill yang dapat ditinjau.

Tampilan insight memuat nama skill, jumlah lowongan yang menyebutnya (n), persentase dari total lowongan yang dianalisis (N), indikator “tercantum di CV / belum ditemukan / perlu verifikasi”, serta contoh persyaratan terkait. Angka frekuensi adalah indikasi permintaan pada sampel lowongan, bukan seluruh pasar kerja.

Urutan belajar yang disarankan: skill wajib yang sering diminta dan belum ditemukan di CV menjadi prioritas tinggi. Pengguna juga dapat menandai skill yang sebenarnya dikuasai tetapi belum tertulis di CV, tanpa sistem otomatis menyatakan kemampuan tersebut telah diverifikasi.

# **8\. Sumber Data dan Batasan Akuisisi**

* Sumber MVP: dataset lowongan yang memiliki izin penggunaan, data sampel yang dikurasi, atau input manual admin. Simpan URL sumber dan waktu pengambilan bila tersedia.  
* Integrasi platform pihak ketiga, termasuk LinkedIn, hanya dilakukan jika akses dan cara pengambilannya diizinkan oleh penyedia serta mematuhi ketentuan yang berlaku. Jangan mengandalkan scraping LinkedIn sebagai prasyarat demo.  
* Satu lowongan dapat memuat skill duplikat; hitung frekuensi pada level posting unik, bukan frekuensi kata berulang di satu posting.  
* Perlu deduplikasi iklan, penanda posting kedaluwarsa, dan informasi ukuran sampel agar grafik tidak menyesatkan.

# **9\. Kebutuhan Nonfungsional**

| ID | Kebutuhan | Kriteria penerimaan awal |
| :---- | :---- | :---- |
| **NFR-01** | Responsif dan aksesibel | Seluruh alur inti berfungsi pada mobile dan desktop; navigasi keyboard, label input, kontras, dan status nonwarna. |
| **NFR-02** | Privasi CV | Persetujuan eksplisit untuk unggah dan pemrosesan; pengguna dapat menghapus CV dan hasil ekstraksi. |
| **NFR-03** | Transparansi | Skor disertai komponen dan contoh bukti; grafik menyebut N, filter dan tanggal dataset. |
| **NFR-04** | Keandalan | Error upload, CV tak terbaca, dan ketiadaan data ditangani dengan pesan yang jelas. |
| **NFR-05** | Kecepatan | Alur demo tidak terhambat; tampilkan loading state saat ekstraksi/pencocokan. |
| **NFR-06** | Keamanan | Validasi jenis/ukuran file, pembatasan akses data akun, dan tidak mengekspos dokumen publik. |

# **10\. Halaman dan Elemen UI**

| Halaman | Konten minimal |
| :---- | :---- |
| **Landing** | Masalah utama, cara kerja tiga langkah, CTA “Analisis CV”, preview skill insights. |
| **Onboarding / CV** | Unggah CV, pratinjau hasil ekstraksi, edit skill, pilihan role target. |
| **Job Explorer** | Daftar lowongan, filter, ringkasan match, status tersimpan. |
| **Job Detail** | Persyaratan, bukti kesesuaian, gap skill, faktor status, tautan sumber. |
| **Market Skill Insights** | Bar chart top skill, N lowongan, filter role/lokasi, checklist skill CV, rekomendasi prioritas. |
| **My Progress** | Lowongan tersimpan, daftar skill untuk dipelajari, penanda progres. |
| **Admin Import** | Tambah/edit lowongan, review normalisasi skill dan metadata sumber. |

# **11\. MVP Lomba vs Fase Lanjutan**

| MVP sampai 7 November 2026 | Pengembangan setelah MVP |
| :---- | :---- |
| **Dataset legal dan terkurasi untuk 1–2 role, misalnya Data Analyst dan BI Analyst** | Integrasi sumber job posting berizin dan pembaruan berkala |
| **Unggah satu CV contoh \+ ekstraksi dan koreksi manual** | Profil multi-CV dan histori perubahan |
| **Pencocokan berbasis aturan/semantic sederhana dengan alasan jelas** | Evaluasi model ranking dengan data relevansi yang dilabeli |
| **Top skills berbasis hitungan posting dan perbandingan skill CV** | Tren bulanan, per wilayah, dan analisis evolusi skill |
| **Halaman responsif dengan alur demo lengkap** | Learning roadmap terhubung sumber belajar dan tracking mendalam |

# **12\. Acceptance Criteria dan Skenario Demo**

* AC-01: Setelah CV diunggah, pengguna bisa melihat serta mengoreksi skill yang terdeteksi sebelum perhitungan match.  
* AC-02: Untuk lowongan terpilih, status skill wajib dibedakan menjadi cocok, belum ditemukan, dan belum cukup bukti.  
* AC-03: Ketika filter role diubah, jumlah sampel N dan ranking top skill ikut berubah sesuai data.  
* AC-04: Skill yang ada di CV diberi checkmark; yang tidak ditemukan ditandai dengan label teks, bukan hanya warna.  
* AC-05: Status match dan underqualified dapat diperagakan menggunakan dua CV contoh berbeda; potentially overqualified hanya ditampilkan jika bukti senioritas memadai.  
* AC-06: Pengguna dapat mengetahui mengapa skor tertentu muncul dan membuka sumber lowongan terkait.

Demo 3–5 menit yang disarankan: pilih Data Analyst → unggah CV contoh → review skill → buka Job Explorer dan pilih lowongan → lihat penjelasan match/gap → buka Market Skill Insights → lihat tiga skill pasar paling sering diminta namun belum tercantum di CV → tambahkan ke daftar belajar.

# **13\. Risiko dan Keputusan Terbuka**

* Tidak adanya akses legal ke lowongan langsung. Mitigasi: sumber terkurasi dan transparansi tanggal data.  
* Ekstraksi CV salah atau tidak lengkap. Mitigasi: pratinjau dan koreksi manual.  
* Bias dan kesalahan klasifikasi overqualified. Mitigasi: indikator tentatif, alasan jelas, tidak dipakai untuk keputusan otomatis rekrutmen.  
* Skill yang tidak tercantum di CV bukan berarti tidak dimiliki. Mitigasi: label “belum ditemukan”, bukan “tidak punya”.  
* Keputusan produk yang perlu diuji: definisi bobot skor, cakupan role pertama, ukuran dataset awal, batas penyimpanan CV, dan apakah login wajib pada demo.

# **14\. Indikator Keberhasilan Produk**

Metrik rancangan untuk uji pengguna: persentase pengguna yang menyelesaikan alur unggah CV → menemukan lowongan → melihat skill gap; waktu menemukan tiga lowongan relevan; ketepatan interpretasi grafik top skills; kemampuan menjelaskan alasan skor; dan tingkat keberhasilan tugas pada perangkat mobile.

Referensi ketentuan lomba: Guidebook Web Design Competition INVOFEST 2026, terutama halaman 3, 9, 10, 11, dan 13\. Asumsi desain dan definisi produk dalam dokumen ini adalah usulan rancangan, bukan ketentuan dari guidebook.