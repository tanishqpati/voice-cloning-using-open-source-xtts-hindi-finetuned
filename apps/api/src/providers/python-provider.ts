import FormData from "form-data";
import type { ModelConfig, TTSProviderInput, TTSProviderResult } from "@tts/config";
import type { TTSProvider } from "./types";

interface PythonSynthesizeResponse {
  audio_url: string;
}

export class PythonTTSProvider implements TTSProvider {
  constructor(private readonly config: ModelConfig) {}

  async synthesize(input: TTSProviderInput): Promise<TTSProviderResult> {
    const form = new FormData();
    form.append("text", input.text);
    form.append("language", input.language);
    form.append("file", input.file, {
      filename: input.filename,
      contentType: input.contentType
    });

    const response = await fetch(this.config.endpoint, {
      method: "POST",
      body: form as unknown as BodyInit,
      headers: form.getHeaders()
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Python provider failed with ${response.status}: ${details}`);
    }

    const result = (await response.json()) as PythonSynthesizeResponse;
    return { audio_url: result.audio_url };
  }
}
