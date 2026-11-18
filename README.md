# Myengineer

Asisten teknis berbasis AI untuk teknisi dan operator industri manufaktur.

## Mendapatkan API key

1. Buka https://aistudio.google.com/apikey
2. Login dengan akun Google.
3. Pilih **Create API key** dan salin kuncinya.

## Konfigurasi

1. Salin `.env.example` menjadi `.env`.
2. Isi nilai berikut:

```env
GEMINI_API_KEY=kunci_api_anda
GEMINI_MODEL=gemini-2.5-flash
```

Nama model dapat diganti sesuai model yang tersedia pada akun Google AI Studio Anda.

## Menjalankan aplikasi

```bash
npm install
npm start
```

Buka http://localhost:3000 di browser.

Untuk pengembangan dengan restart otomatis:

```bash
npm run dev
```

## Deployment Vercel

Tambahkan Environment Variables pada project Vercel:

- `GEMINI_API_KEY`: key API Google AI Studio
- `GEMINI_MODEL`: `gemini-3-flash-preview`

Jangan upload file `.env` ke Git. Vercel membaca environment variables dari dashboard project, lalu lakukan redeploy.
