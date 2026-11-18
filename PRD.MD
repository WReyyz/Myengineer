Buatkan aplikasi web AI chat bernama "Myengineer": asisten teknis untuk teknisi dan operator di industri manufaktur. Gunakan Google Gemini API (Google AI Studio).

## STACK
- Backend: Node.js + Express
- Frontend: HTML, CSS, dan JavaScript biasa (tanpa framework), disajikan oleh Express dari folder /public
- Library Gemini: paket resmi "@google/genai"
- Konfigurasi lewat file .env: GEMINI_API_KEY dan GEMINI_MODEL (supaya nama model mudah diganti tanpa mengubah kode)
- Buat juga .env.example (tanpa key asli) dan .gitignore yang memuat .env dan node_modules

## KEAMANAN (WAJIB)
- API key HANYA dipakai di backend. Jangan pernah menaruhnya di kode frontend atau mengirimnya ke browser.
- Frontend memanggil endpoint POST /api/chat di backend; backend yang memanggil Gemini.
- Tambahkan rate limiting sederhana (misalnya 20 request per menit per IP) dan batasi ukuran request.
- Validasi input: batasi panjang teks, jenis file gambar (JPEG, PNG, WebP), dan ukuran gambar (maksimal 5 MB per gambar, maksimal 3 gambar per pesan).
- Tampilkan pesan error yang ramah dalam Bahasa Indonesia (key salah, kuota habis, jaringan gagal), tanpa membocorkan detail teknis atau key.

## FITUR
1. Chat dengan riwayat percakapan: pesan pengguna di kanan, jawaban AI di kiri. Riwayat dikirim ulang ke backend di setiap pesan agar AI paham konteks.
2. Upload foto: tombol lampiran (dan dukung ambil foto langsung dari kamera HP). Tampilkan preview gambar sebelum dikirim, dengan tombol hapus. Kompres atau perkecil gambar di sisi browser (maksimal sisi terpanjang 1600 px) sebelum dikirim, lalu kirim sebagai base64 ke backend.
3. Jawaban AI ditampilkan dengan format markdown (judul, daftar, tebal, tabel, blok kode), memakai library markdown dari CDN.
4. Tombol "Percakapan baru" untuk mereset riwayat.
5. Indikator "Myengineer sedang mengetik..." selama menunggu jawaban.
6. Tombol salin pada setiap jawaban AI.
7. Riwayat percakapan disimpan di localStorage browser supaya tidak hilang saat halaman di-refresh.

## TAMPILAN
- Desain bersih dan modern, tema gelap dengan aksen oranye atau kuning industri.
- Mobile-first: teknisi akan memakai HP di lapangan. Tombol besar, kolom ketik di bawah, dan nyaman dipakai satu tangan.
- Header berisi nama "Myengineer" dengan subjudul "Asisten Teknis Industri Manufaktur".
- Di layar awal, tampilkan 4 contoh pertanyaan yang bisa diklik, misalnya: "Motor 3 fasa berdengung dan tidak mau berputar, apa penyebabnya?", "Cara membaca kode error inverter", "Bearing cepat panas, kemungkinan penyebabnya?", "Jadwal preventive maintenance kompresor".

## SYSTEM INSTRUCTION UNTUK GEMINI
Pasang teks berikut sebagai system instruction di setiap request ke Gemini:

"Kamu adalah Myengineer, asisten teknis berpengalaman untuk teknisi, operator, dan engineer di industri manufaktur. Kamu menguasai: mesin produksi, motor listrik dan inverter/VFD, PLC dan panel kontrol, sensor dan instrumentasi, pneumatik dan hidrolik, pompa, kompresor, bearing, gearbox, conveyor, sistem pendingin dan HVAC industri, perawatan preventif dan prediktif, serta analisis akar masalah (5 Why, fishbone).

Aturan menjawab:
1. Jawab dalam Bahasa Indonesia yang jelas dan praktis, dengan istilah teknis yang lazim dipakai di pabrik. Sesuaikan dengan bahasa pengguna.
2. Untuk masalah kerusakan, susun jawaban: (a) kemungkinan penyebab, diurutkan dari yang paling mungkin; (b) langkah pengecekan berurutan dari yang paling mudah dan aman; (c) solusi atau perbaikan; (d) pencegahan.
3. Jika informasi kurang (merek, tipe, tegangan, gejala, kapan terjadi), ajukan maksimal 3 pertanyaan klarifikasi yang paling penting. Jangan menebak dengan yakin.
4. Jika pengguna mengirim foto, jelaskan dulu apa yang terlihat, lalu analisis. Jika foto buram, gelap, atau tidak cukup jelas, minta foto ulang dan sebutkan bagian mana yang perlu difoto (misalnya name plate, display error, kabel, kondisi komponen).
5. Utamakan keselamatan. Untuk pekerjaan berisiko (listrik tegangan tinggi, tekanan, bagian berputar, ruang terbatas, panas, bahan kimia), selalu ingatkan prosedur LOTO (lockout-tagout), APD yang sesuai, dan perlunya personel yang berwenang. Jangan menyarankan bypass pengaman (interlock, emergency stop, thermal overload).
6. Jika sebuah jawaban bergantung pada manual resmi, spesifikasi pabrikan, atau standar tertentu, katakan terus terang dan sarankan merujuk ke dokumen itu. Jangan mengarang nilai spesifikasi, kode error, atau nomor part. Jika tidak yakin, katakan tidak yakin.
7. Untuk kasus yang berpotensi membahayakan keselamatan atau kerusakan besar, sarankan eskalasi ke supervisor, engineer senior, atau teknisi dari pabrikan.
8. Gunakan format rapi: daftar bernomor untuk langkah, tabel untuk perbandingan, dan satuan yang jelas (V, A, bar, °C, Nm).
9. Tolak dengan sopan pertanyaan di luar bidang teknik, mesin, dan industri, lalu arahkan kembali ke topik teknis."

## STRUKTUR PROYEK
- server.js
- package.json (dengan script "start" dan "dev")
- /public/index.html, /public/style.css, /public/app.js
- .env.example, .gitignore, README.md

## README.md
Tulis dalam Bahasa Indonesia, berisi: cara mendapatkan API key di https://aistudio.google.com/apikey, cara membuat file .env, cara menjalankan (npm install lalu npm start), dan alamat untuk membuka aplikasi (http://localhost:3000).

## CARA KERJA
Buat semua file, jalankan npm install, lalu jalankan server dan pastikan tidak ada error saat startup. Jangan menaruh key asli di file mana pun. Setelah selesai, beri tahu saya langkah singkat untuk mengisi .env dan membuka aplikasinya.