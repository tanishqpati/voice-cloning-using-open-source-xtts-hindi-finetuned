import os
import shutil
import tempfile
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from TTS.api import TTS

# Coqui-registered model name for XTTS v2 (multilingual, supports Hindi)
COQUI_MODEL = "tts_models/multilingual/multi-dataset/xtts_v2"
# Optional HuggingFace fine-tuned checkpoint to overlay (set to empty string to skip)
HF_FINETUNED = os.getenv("HF_FINETUNED", "")
MODEL_ID = os.getenv("MODEL_ID") or HF_FINETUNED or COQUI_MODEL
OUTPUT_DIR = Path("/tmp/tts-service/outputs")
UPLOAD_DIR = Path("/tmp/tts-service/uploads")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="TTS Service")
app.mount("/audio", StaticFiles(directory=str(OUTPUT_DIR)), name="audio")

tts = None


@app.on_event("startup")
def startup_event():
    global tts
    if HF_FINETUNED:
        from huggingface_hub import snapshot_download
        model_dir = snapshot_download(HF_FINETUNED)
        config_path = os.path.join(model_dir, "config.json")
        tts = TTS(model_path=model_dir, config_path=config_path)
    else:
        tts = TTS(model_name=COQUI_MODEL)


def synthesize(text: str, speaker_wav: str, language: str = "hi") -> Path:
    output_path = OUTPUT_DIR / f"{uuid.uuid4()}.wav"
    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_wav,
        language=language,
        file_path=str(output_path)
    )
    return output_path


@app.get("/health")
def health():
    return {"status": "ok", "model_id": MODEL_ID}


@app.get("/models")
def list_models():
    return {
        "models": [
            {
                "id": MODEL_ID,
                "provider": "coqui",
                "type": "tts",
                "endpoint": os.getenv("TTS_SERVICE_URL", "http://127.0.0.1:8000"),
                "language": "hi",
                "huggingface_id": HF_FINETUNED or None,
            }
        ]
    }


@app.post("/generate")
async def generate_api(
    text: str = Form(...),
    model: str = Form(MODEL_ID),
    language: str = Form("hi"),
    file: UploadFile = File(...),
):
    if model and model != MODEL_ID:
        raise HTTPException(status_code=400, detail=f"Unknown model '{model}'.")
    return await synthesize_api(text=text, language=language, file=file)


@app.post("/synthesize")
async def synthesize_api(
    text: str = Form(...),
    language: str = Form("hi"),
    file: UploadFile = File(...)
):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is required.")

    suffix = Path(file.filename or "input.wav").suffix or ".wav"
    temp_input = Path(tempfile.mkstemp(suffix=suffix, dir=UPLOAD_DIR)[1])

    try:
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        output_path = synthesize(text=text, speaker_wav=str(temp_input), language=language)
        return {"audio_url": f"/audio/{output_path.name}"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {exc}") from exc
    finally:
        try:
            temp_input.unlink(missing_ok=True)
        except OSError:
            pass
