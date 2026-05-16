import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Mengambil API Key dari Environment Variable Vercel
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleAIAction = async () => {
    if (!input) return alert("Silakan ketik sesuatu dulu");
    setLoading(true);
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Inisialisasi Model dengan Setting Anti-Sensor (BLOCK_NONE)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      });

      const prompt = `Berikan ide skenario kreatif untuk face swap berdasarkan teks ini: ${input}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setResult(response.text());
    } catch (error) {
      console.error(error);
      setResult("Gagal memproses AI. Pastikan API Key benar dan internet stabil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">AI Face Swap Scenario</h1>
      
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-xl shadow-lg">
        <textarea 
          className="w-full p-4 bg-gray-700 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ketik tema atau konsep di sini..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        
        <button 
          onClick={handleAIAction}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-all"
        >
          {loading ? "Sedang Memproses..." : "✨ Perbagus Prompt / Ide Skenario"}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <h2 className="text-sm text-gray-400 mb-2">Hasil AI:</h2>
            <p className="leading-relaxed">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;