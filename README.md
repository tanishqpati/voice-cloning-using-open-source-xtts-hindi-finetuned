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

2. Run all services:

```bash
yarn dev
```
