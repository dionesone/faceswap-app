from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate")
async def generate_image(
    face_image: UploadFile = File(...),
    body_image: UploadFile = File(...),
    prompt: str = Form(...)
):
    # Logika inferensi Face Swap AI akan ditempatkan di sini
    # Menggunakan pipeline kontrol wajah
    return {"status": "success", "message": "Proses gambar dimulai"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
