# TTS Service

## Setup

```bash
cd services/tts-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
MODEL_ID=Abhinay45/XTTS-Hindi-finetuned uvicorn main:app --reload --port 8000
```
