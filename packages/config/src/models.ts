export interface TTSProviderInput {
  text: string;
  language: string;
  file: Buffer;
  filename: string;
  contentType: string;
}

export interface TTSProviderResult {
  audio_url: string;
}

export interface ModelConfig {
  provider: string;
  type: "python";
  endpoint: string;
  language: string;
  huggingface_id?: string;
}

export const MODELS: Record<string, ModelConfig> = {
  xtts_hi: {
    provider: "xtts",
    type: "python",
    huggingface_id: "Abhinay45/XTTS-Hindi-finetuned",
    endpoint: "http://localhost:8000/synthesize",
    language: "hi"
  }
};

export function listModels() {
  return Object.entries(MODELS).map(([id, config]) => ({
    id,
    ...config
  }));
}

export function getModel(modelName: string): ModelConfig {
  const model = MODELS[modelName];

  if (!model) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  return model;
}
