import os
import shutil
import tempfile
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from TTS.api import TTS

MODEL_ID = os.getenv("MODEL_ID", "Abhinay45/XTTS-Hindi-finetuned")
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
    tts = TTS(model_name=MODEL_ID)


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
