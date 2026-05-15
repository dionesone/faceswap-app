import React, { useState } from 'react';

function App() {
  const [faceImage, setFaceImage] = useState(null);
  const [bodyImage, setBodyImage] = useState(null);
  const [prompt, setPrompt] = useState("Subjek memakai celana renang. Aktifkan mode konsistensi wajah yang ketat. Prioritaskan fitur wajah dari gambar referensi yang diberikan untuk semua generasi berikutnya. Pertahankan identitas subjek secara akurat sambil hanya menyesuaikan pose, pencahayaan, dan latar belakang. Jangan mengubah struktur wajah inti.");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e, setImage) => {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    // Simulasi proses
    setTimeout(() => setIsProcessing(false), 2000); 
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">AI Face Swap & Image Generator</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-dashed border-gray-300 p-4 rounded text-center">
            <h2 className="font-semibold mb-2">1. Unggah Referensi Wajah</h2>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setFaceImage)} className="mb-2 text-sm" />
            {faceImage && <img src={faceImage} alt="Face" className="max-h-48 mx-auto mt-2 rounded" />}
          </div>

          <div className="border-2 border-dashed border-gray-300 p-4 rounded text-center">
            <h2 className="font-semibold mb-2">2. Unggah Referensi Tubuh/Pose</h2>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setBodyImage)} className="mb-2 text-sm" />
            {bodyImage && <img src={bodyImage} alt="Body" className="max-h-48 mx-auto mt-2 rounded" />}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold mb-2">3. Prompt Deskripsi Gambar</h2>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows="4"
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={!faceImage || !bodyImage || isProcessing}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isProcessing ? 'Memproses Gambar...' : 'Generate Gambar'}
        </button>
      </div>
    </div>
  );
}

export default App;