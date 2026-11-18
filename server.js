require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_TEXT_LENGTH = 12000;
const MAX_IMAGES = 3;

const SYSTEM_INSTRUCTION = `Kamu adalah Myengineer, asisten teknis berpengalaman untuk teknisi, operator, dan engineer di industri manufaktur. Kamu menguasai: mesin produksi, motor listrik dan inverter/VFD, PLC dan panel kontrol, sensor dan instrumentasi, pneumatik dan hidrolik, pompa, kompresor, bearing, gearbox, conveyor, sistem pendingin dan HVAC industri, perawatan preventif dan prediktif, serta analisis akar masalah (5 Why, fishbone).

Aturan menjawab:
1. Jawab dalam Bahasa Indonesia yang jelas dan praktis, dengan istilah teknis yang lazim dipakai di pabrik. Sesuaikan dengan bahasa pengguna.
2. Untuk masalah kerusakan, susun jawaban: (a) kemungkinan penyebab, diurutkan dari yang paling mungkin; (b) langkah pengecekan berurutan dari yang paling mudah dan aman; (c) solusi atau perbaikan; (d) pencegahan.
3. Jika informasi kurang (merek, tipe, tegangan, gejala, kapan terjadi), ajukan maksimal 3 pertanyaan klarifikasi yang paling penting. Jangan menebak dengan yakin.
4. Jika pengguna mengirim foto, jelaskan dulu apa yang terlihat, lalu analisis. Jika foto buram, gelap, atau tidak cukup jelas, minta foto ulang dan sebutkan bagian mana yang perlu difoto (misalnya name plate, display error, kabel, kondisi komponen).
5. Utamakan keselamatan. Untuk pekerjaan berisiko (listrik tegangan tinggi, tekanan, bagian berputar, panas, bahan kimia), selalu ingatkan prosedur LOTO (lockout-tagout), APD yang sesuai, dan perlunya personel yang berwenang. Jangan menyarankan bypass pengaman (interlock, emergency stop, thermal overload).
6. Jika sebuah jawaban bergantung pada manual resmi, spesifikasi pabrikan, atau standar tertentu, katakan terus terang dan sarankan merujuk ke dokumen itu. Jangan mengarang nilai spesifikasi, kode error, atau nomor part. Jika tidak yakin, katakan tidak yakin.
7. Untuk kasus yang berpotensi membahayakan keselamatan atau kerusakan besar, sarankan eskalasi ke supervisor, engineer senior, atau teknisi dari pabrikan.
8. Gunakan format rapi: daftar bernomor untuk langkah, tabel untuk perbandingan, dan satuan yang jelas (V, A, bar, °C, Nm).
9. Tolak dengan sopan pertanyaan di luar bidang teknik, mesin, dan industri, lalu arahkan kembali ke topik teknis.`;

app.use(express.json({ limit: '15mb' }));
app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan. Silakan coba lagi setelah satu menit.' }
});
app.use('/api/chat', limiter);

function friendlyGeminiError(error) {
  const status = error?.status || error?.statusCode;
  const text = String(error?.message || '').toLowerCase();
  if (status === 401 || status === 403 || text.includes('api key') || text.includes('unauthenticated')) {
    return 'Kunci API belum valid atau belum memiliki akses. Periksa konfigurasi di file .env.';
  }
  if (status === 429 || text.includes('quota') || text.includes('resource has been exhausted')) {
    return 'Kuota penggunaan AI sudah habis atau sedang dibatasi. Coba lagi nanti.';
  }
  if (text.includes('fetch') || text.includes('network') || text.includes('timed out') || text.includes('unavailable')) {
    return 'Koneksi ke layanan AI sedang bermasalah. Periksa jaringan lalu coba lagi.';
  }
  return 'Maaf, jawaban belum dapat diproses saat ini. Silakan coba lagi.';
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Pesan percakapan tidak boleh kosong.' });
    }
    if (messages.length > 100) {
      return res.status(400).json({ error: 'Riwayat percakapan terlalu panjang.' });
    }

    const sanitizedHistory = [];
    for (const message of messages) {
      if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
        return res.status(400).json({ error: 'Format percakapan tidak valid.' });
      }
      if (message.content.length > MAX_TEXT_LENGTH) {
        return res.status(400).json({ error: `Teks maksimal ${MAX_TEXT_LENGTH.toLocaleString('id-ID')} karakter.` });
      }

      const parts = [];
      if (message.content) parts.push({ text: message.content });

      if (Array.isArray(message.images)) {
        if (message.images.length > MAX_IMAGES) {
          return res.status(400).json({ error: 'Maksimal 3 gambar per pesan.' });
        }
        for (const image of message.images) {
          if (!image || typeof image.data !== 'string') {
            return res.status(400).json({ error: 'Data gambar tidak valid.' });
          }
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType)) {
            return res.status(400).json({ error: 'Jenis gambar hanya boleh JPEG, PNG, atau WebP.' });
          }
          const base64 = image.data.replace(/^data:[^;]+;base64,/, '');
          const sizeBytes = Buffer.from(base64, 'base64').length;
          if (sizeBytes > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Ukuran satu gambar maksimal 5 MB.' });
          }
          parts.push({ inlineData: { mimeType: image.mimeType, data: base64 } });
        }
      }

      if (parts.length) {
        sanitizedHistory.push({ role: message.role === 'assistant' ? 'model' : 'user', parts });
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Layanan AI belum dikonfigurasi. Tambahkan GEMINI_API_KEY pada file .env.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: sanitizedHistory,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });

    return res.json({ text: response.text || 'Maaf, tidak ada jawaban yang dapat diberikan.' });
  } catch (error) {
    console.error('Gemini request failed:', error?.status || error?.code || 'unknown');
    return res.status(502).json({ error: friendlyGeminiError(error) });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Myengineer berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
