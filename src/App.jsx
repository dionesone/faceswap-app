import { useState, useRef } from 'react';
import { UploadCloud, User, ImageIcon, Sparkles, AlertCircle, RefreshCw, Download } from 'lucide-react';

export default function App() {
  const [faceImage, setFaceImage] = useState(null);
  const [bodyImage, setBodyImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState('');

  // Mengambil API Key dari file .env
  const apiKey = String(import.meta.env.VITE_GEMINI_API_KEY).trim();

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const enhancePromptWithLLM = async () => {
    if (!prompt) {
      setError("Silakan ketik sedikit ide di kolom prompt terlebih dahulu untuk diperbagus.");
      return;
    }
    setIsEnhancingPrompt(true);
    setError('');
    
    try {
      const llmPrompt = `Saya menggunakan AI image generator untuk melakukan face swap. Pengguna memberikan ide dasar berikut: "${prompt}". Kembangkan ide ini menjadi prompt gambar yang sangat detail, deskriptif, dan fotorealistik dalam bahasa Indonesia. Fokus pada pencahayaan, suasana, lingkungan, dan pakaian. Jaga agar tetap di bawah 40 kata. HANYA kembalikan teks prompt-nya saja tanpa pengantar atau penutup.`;
      
      const payload = { contents: [{ parts: [{ text: llmPrompt }] }] };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Gagal memanggil LLM");
      const result = await response.json();
      const enhancedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (enhancedText) setPrompt(enhancedText.trim());
    } catch (err) {
      console.error(err); // <-- PERBAIKAN: variabel err sekarang digunakan
      setError("Gagal meningkatkan prompt dengan AI. Pastikan API Key sudah benar.");
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const suggestScenarioWithLLM = async () => {
    setIsSuggesting(true);
    setError('');
    
    try {
      const llmPrompt = `Berikan SATU ide skenario atau pengaturan latar belakang yang unik, sinematik, keren, atau lucu untuk sebuah gambar face swap. HANYA kembalikan teks skenarionya saja dalam bahasa Indonesia. Maksimal 20 kata.`;
      
      const payload = { contents: [{ parts: [{ text: llmPrompt }] }] };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Gagal memanggil LLM");
      const result = await response.json();
      const suggestion = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (suggestion) setPrompt(suggestion.trim());
    } catch (err) {
      console.error(err); // <-- PERBAIKAN: variabel err sekarang digunakan
      setError("Gagal mendapatkan saran dari AI. Pastikan API Key sudah benar.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const generateFaceSwap = async () => {
    if (!faceImage || !bodyImage) {
      setError('Mohon unggah gambar Wajah dan gambar Badan terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResultImage(null);

    const faceBase64 = faceImage.data.split(',')[1];
    const bodyBase64 = bodyImage.data.split(',')[1];

    const systemInstruction = `TUGAS: Face Swap (Ganti Wajah) Fotorealistik Tanpa Mengubah Frame.

ATURAN KETAT:
1. KONSISTENSI BINGKAI & TUBUH (PENTING!): Gambar hasil HARUS mempertahankan komposisi, pose tubuh, pakaian, latar belakang, dan rasio aspek (frame) yang PERSIS SAMA dengan gambar referensi KEDUA (Badan/Latar). Dilarang keras mengubah ukuran, memotong (crop), atau merombak background asli.
2. KONSISTENSI WAJAH (PREFERENSI): Aktifkan mode konsistensi wajah yang ketat. Ganti wajah pada gambar KEDUA dengan wajah dari gambar PERTAMA. Pertahankan identitas wajah subjek (Gambar 1) secara akurat tanpa mengubah struktur wajah inti.
3. PENYATUAN (BLENDING): Sesuaikan arah cahaya, bayangan, resolusi, dan tekstur kulit wajah agar menyatu sempurna tanpa batas (seamless) dengan tubuh di gambar KEDUA.

Instruksi Tambahan Pengguna: ${prompt || 'Buat sangat fotorealistik, pastikan batas leher dan wajah menyatu sempurna tanpa terlihat editan.'}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: systemInstruction },
          { inlineData: { mimeType: faceImage.type, data: faceBase64 } },
          { inlineData: { mimeType: bodyImage.type, data: bodyBase64 } }
        ]
      }],
      generationConfig: { responseModalities: ["IMAGE"] }
    };

    const maxRetries = 5;
    const delays = [1000, 2000, 4000, 8000, 16000];
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        const generatedImageData = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
        
        if (generatedImageData && generatedImageData.data) {
          setResultImage(`data:${generatedImageData.mimeType};base64,${generatedImageData.data}`);
          setIsGenerating(false);
          return;
        } else {
          throw new Error("Gambar tidak ditemukan dalam respons API.");
        }
      } catch (err) {
        attempt++;
        console.error(err); // <-- PERBAIKAN: variabel err sekarang digunakan
        if (attempt >= maxRetries) {
          setError('Gagal menghasilkan gambar. Pastikan API Key di file .env sudah benar.');
          setIsGenerating(false);
          return;
        }
        await sleep(delays[attempt - 1]);
      }
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement("a");
      link.href = resultImage;
      link.download = "faceswap-result.png";
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            AI Face Swap Pro
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Tukar wajah dengan mulus menggunakan teknologi AI terbaru dari Google.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="space-y-3">
              <label className="flex items-center gap-2 font-semibold text-gray-700">
                <User className="w-5 h-5 text-blue-500" /> 1. Gambar Wajah Subjek
              </label>
              <ImageUploader image={faceImage} setImage={setFaceImage} placeholder="Unggah wajah/leher (Fokus pada muka)" fileToBase64={fileToBase64} />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 font-semibold text-gray-700">
                <ImageIcon className="w-5 h-5 text-purple-500" /> 2. Gambar Target (Badan/Latar)
              </label>
              <ImageUploader image={bodyImage} setImage={setBodyImage} placeholder="Unggah gambar badan atau latar target" fileToBase64={fileToBase64} />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 font-semibold text-gray-700">
                <Sparkles className="w-5 h-5 text-amber-500" /> 3. Prompt Tambahan (Opsional)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Buat pencahayaannya sinematik..."
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[100px]"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={enhancePromptWithLLM} disabled={isEnhancingPrompt || !prompt} className="text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2">
                  {isEnhancingPrompt ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>✨</span>} Perbagus Prompt
                </button>
                <button onClick={suggestScenarioWithLLM} disabled={isSuggesting} className="text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 px-4 py-2 rounded-lg flex items-center gap-2">
                  {isSuggesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>✨</span>} Ide Skenario Acak
                </button>
              </div>
            </div>

            <button onClick={generateFaceSwap} disabled={isGenerating || !faceImage || !bodyImage} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${isGenerating || !faceImage || !bodyImage ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:shadow-xl'}`}>
              {isGenerating ? <><RefreshCw className="w-5 h-5 animate-spin" /> Memproses AI...</> : <><Sparkles className="w-5 h-5" /> Generate Face Swap</>}
            </button>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Hasil Generasi</h2>
            <div className="flex-1 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden min-h-[400px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center space-y-4 text-blue-600">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="font-medium animate-pulse">Menyelaraskan struktur wajah...</p>
                </div>
              ) : resultImage ? (
                <div className="w-full h-full relative group">
                  <img src={resultImage} alt="Hasil" className="w-full h-full object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <button onClick={handleDownload} className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 shadow-xl transition-transform hover:scale-105">
                      <Download className="w-5 h-5" /> Unduh Hasil
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 p-8">
                  <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p>Gambar hasil akan muncul di sini setelah proses selesai.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageUploader({ image, setImage, placeholder, fileToBase64 }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const base64Data = await fileToBase64(file);
      setImage({ data: base64Data, type: file.type, name: file.name });
    }
  };

  return (
    <div className="relative group w-full">
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      {image ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200">
          <img src={image.data} alt="Uploaded" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button onClick={() => fileInputRef.current?.click()} className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100">Ganti Gambar</button>
          </div>
        </div>
      ) : (
        <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-blue-50 cursor-pointer">
          <UploadCloud className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">{placeholder}</p>
        </div>
      )}
    </div>
  );
}