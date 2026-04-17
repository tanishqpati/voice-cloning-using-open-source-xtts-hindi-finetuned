# TTS Provider Platform Monorepo

This repository contains a config-driven TTS provider platform with:

- `apps/web`: Next.js frontend
- `apps/api`: Express orchestrator API
- `services/tts-service`: Python FastAPI TTS runtime
- `packages/config`: Shared model registry and types
- `packages/sdk`: Shared TypeScript SDK client

## Quick Start

1. Install dependencies:

```bash
yarn install
```

2. Run API + web:

```bash
yarn dev
```

3. Run Python TTS service in a separate terminal:

```bash
yarn dev:tts
```

## Environment

- `apps/web` uses `API_BASE_URL` (defaults to `http://localhost:4000`)
- `apps/api` uses `PORT` (defaults to `4000`)
- `services/tts-service` uses:
  - `MODEL_ID` (defaults to `Abhinay45/XTTS-Hindi-finetuned`)
