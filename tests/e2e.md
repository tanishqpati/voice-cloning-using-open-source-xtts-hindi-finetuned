# End-to-End Validation

## 1) Start services

```bash
yarn dev:tts
yarn dev:api
yarn dev:web
```

## 2) Health checks

```bash
curl http://localhost:8000/health
curl http://localhost:4000/health
curl http://localhost:4000/models
```

## 3) Manual generation

1. Open `http://localhost:3000`.
2. Upload a 30-60 second Hindi sample.
3. Enter text and click **Generate**.
4. Confirm a playable output in the audio player.

## 4) API generate smoke

```bash
curl -X POST http://localhost:4000/generate \
  -F "text=नमस्ते, यह परीक्षण है।" \
  -F "model=xtts_hi" \
  -F "file=@/absolute/path/to/sample.wav"
```
