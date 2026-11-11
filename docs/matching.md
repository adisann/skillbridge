# Perhitungan kecocokan CV

Skor adalah estimasi kecocokan terhadap data lowongan yang tersedia, bukan probabilitas diterima kerja. Skor dari dua lowongan dengan kelengkapan persyaratan berbeda tidak menunjukkan tingkat kesulitan yang sama.

Bobot dasar di `web/src/lib/matching-config.ts`:

| Komponen | Bobot | Nilai |
| --- | --- | --- |
| Skill wajib | 35% | Jumlah persyaratan cocok / jumlah persyaratan wajib unik |
| Skill tambahan | 20% | Jumlah persyaratan cocok / jumlah persyaratan tambahan unik |
| Pengalaman | 15% | `min(1, pengalaman relevan / minimum lowongan)`; minimum nol terpenuhi |
| Pendidikan & IPK | 10% | Rata-rata kecocokan jenjang pendidikan dan nilai perbandingan IPK, bila tersedia |
| Semantik | 20% | Nilai kemiripan aktual 0–1, bila tersedia |

Komponen tanpa data pembanding dikeluarkan, lalu bobot sisanya dinormalisasi. Skor akhir adalah jumlah `nilai × bobot efektif`, dikalikan 100 dan dibulatkan. Tidak ada bonus minimum 5/15 poin. Bobot tampilan dibulatkan dengan metode sisa terbesar sehingga jumlahnya tepat 100%.

Skill dihitung sekali per nama kanonis; duplikat pada kelompok tambahan diabaikan jika sudah wajib. Skill yang ditambahkan pengguna di CV Saya dianggap dikuasai: dihitung cocok dan diberi tanda **Ditambahkan oleh pengguna** agar tetap terbedakan dari skill yang terbaca dari teks CV. Ekstraksi yang belum ditinjau berstatus perlu bukti dan belum mendapat poin. Skill tidak disimpulkan dari skill lain yang serumpun. Jenjang pendidikan di bawah syarat mendapat nilai nol; IPK mengikuti rasio IPK kandidat terhadap minimum (batas bawah komponen IPK 0,4).

Alternatif hanya digabung jika sumber menuliskannya secara eksplisit sebagai `/`, `or`, atau `atau` di antara nama skill yang diekstrak. Contoh sumber Kredivo menulis `Python/R`: satu persyaratan cukup dipenuhi Python atau R. `Python and R` tetap dua persyaratan. Bahasa alami yang lebih kompleks tetap memerlukan review ekstraksi. Katalog menyimpan cuplikan alternatif sebelum membuang deskripsi besar, agar daftar dan detail memakai interpretasi yang sama.

Penulisan UI: **Python atau R — terpenuhi melalui Python**. Tipenya tetap **Wajib · pilih salah satu** jika sumber mewajibkan salah satunya. R tidak menjadi skill tambahan hanya karena Python sudah cocok. Kelompok alternatif pada bagian preferred tetap tambahan. Jika keduanya belum ditemukan, pengguna cukup memilih salah satunya untuk dipelajari.

Daftar **contoh alat** berbeda dari daftar wajib biasa. Pada Amar Bank, `analytics tool (Eg: Big Query, Python, R, SPSS, etc)` ditampilkan sebagai satu kelompok contoh alat analitik; Python yang tercantum di CV mendukung kelompok tersebut tanpa menjadikan R/SPSS gap wajib tersendiri. Contoh alat BI diperlakukan serupa. Daftar konsep seperti Statistics/Machine Learning serta `Python and R` tidak otomatis digabung. Jika tidak ada contoh alat yang terbukti, tandai perlu bukti karena daftar berakhiran “etc” masih memungkinkan alat lain. Syarat alat yang eksplisit di luar daftar contoh tetap diperiksa tersendiri.

`Big Query`, `Google Big Query`, dan `BigQuery` dinormalisasi menjadi BigQuery. Pada Amar Bank, BigQuery dan Looker juga disebut eksplisit dalam **Plus Point If You Have**, sehingga tetap dinilai terpisah sebagai skill tambahan. Alat contoh tidak otomatis dijadikan tambahan hanya karena contoh lainnya sudah cocok. Konteks daftar contoh dan syarat eksplisit dipertahankan dalam cache agar hasil daftar dan detail konsisten.

Status dan warna mengikuti persyaratan, bukan ambang skor:

- **Match:** semua syarat wajib yang dievaluasi cocok dan tidak ada syarat wajib dengan bukti yang belum lengkap. Kekurangan skill tambahan memengaruhi skor saja.
- **Underqualified:** ada skill wajib belum ditemukan, pengalaman relevan kurang, jenjang pendidikan di bawah minimum, atau IPK di bawah minimum. Skor tinggi tidak menutupi gap tersebut.
- **Insufficient evidence:** CV belum memuat skill yang dapat dinilai, lowongan belum memuat syarat teknis wajib/pengalaman minimum, atau ada syarat wajib yang belum dapat dipastikan tanpa gap wajib lain yang sudah diketahui. Skor parsial tidak ditampilkan.
- **Potentially overqualified:** syarat wajib cocok, lowongan menyebut level junior/entry/intern/magang, dan pengalaman minimal empat tahun di atas minimum eksplisit lowongan.

Label Mid/Senior tidak digunakan untuk mengarang minimum tahun pengalaman. Pendidikan alternatif D3/S1 menerima D3. Pendidikan atau IPK yang tidak tersedia tidak diasumsikan memenuhi persyaratan.

Kemampuan bahasa dan level sertifikasi yang disebutkan eksplisit ikut dievaluasi. Contoh J&T: **Mandarin (HSK 5)** adalah syarat wajib dari “Minimum HSK Level 5 proficiency”. HSK 5 atau level yang lebih tinggi pada daftar skill CV yang telah ditinjau dapat cocok; HSK di bawah minimum menjadi gap. Mandarin tanpa level HSK, atau HSK yang hasil ekstraksinya belum ditinjau, memerlukan bukti. Level yang ditambahkan pengguna dihitung seperti level yang tercantum. Tercantum di CV tidak berarti sertifikat telah diverifikasi independen. Level tidak disimpulkan dari kata “Mandarin Speaker” saja. Bahasa yang tertulis preferred tetap skill tambahan.

JLPT memakai urutan terbalik: N1 tertinggi, lalu N2 sampai N5. Syarat N1 dengan CV N5 menghasilkan **Underqualified**, label **Di bawah minimum**, dan alasan yang menyebut kedua level. Bahasa Jepang tanpa level JLPT memerlukan bukti; level N1 yang ditambahkan pengguna dihitung memenuhi syarat N1. Syarat bahasa tambahan memengaruhi komponen tambahan saja. Sistem sertifikasi yang berbeda tidak dikonversi otomatis.

Padanan Indonesia–Inggris menggunakan satu kamus di `web/src/lib/data/skill-aliases.json`, dibaca web dan worker. Contoh: Statistika/Statistik/Statistics, Analisis Data/Data Analisis/Data Analysis, Pemodelan Data/Data Modeling. Alias dihitung sekali untuk matching, CV, frekuensi skill per posting, dan identitas rencana belajar. Cuplikan CV tidak hilang ketika alias digabung; skill tambahan pengguna tetap bertanda tambahan pengguna. SQL/PostgreSQL serta Data Analysis/Data Science tetap berbeda. Kamus berada di dalam proyek web agar bisa diimpor Turbopack.

Filter lokasi menerima teks kota/provinsi selain pilihan dropdown. Input kosong mengembalikan “Semua Lokasi”; pilihan lama tetap tersedia, dengan navigasi panah, Enter, Escape, dan label input.

Deskripsi generik berakhiran “Deskripsi kualifikasi lowongan” ditandai perlu ditinjau; daftar skill saja tidak cukup untuk menyimpulkan kelengkapan persyaratannya. Ini berlaku juga untuk katalog yang deskripsinya dibuang setelah proses cache. Deskripsi lengkap harus dipulihkan dari sumber sebelum alternatif yang tidak tersimpan bisa dikenali.

Status **Data lowongan belum lengkap** membedakan kendala data sumber dari **Bukti CV belum cukup**. Worker melewati deskripsi kosong/placeholder dan mencatat item gagal, tanpa mengganti deskripsi lama yang lengkap. Pengambilan detail LinkedIn tetap anonim dan berhenti untuk seluruh run jika menerima 403/429/999, CAPTCHA, atau pengalihan autentikasi.

Pengujian regresi: `web/tests/matching-qualification.test.ts`, `matching.test.ts`, dan `demo-flow.test.ts`, termasuk cuplikan sumber asli Kredivo dan Pangan Lestari dari katalog offline. Hasil tetap bergantung pada kelengkapan ekstraksi CV dan lowongan; tercantum di CV bukan verifikasi independen.
