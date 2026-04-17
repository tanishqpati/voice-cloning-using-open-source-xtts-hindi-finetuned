import type { TTSProviderInput, TTSProviderResult } from "@tts/config";

export interface TTSProvider {
  synthesize(input: TTSProviderInput): Promise<TTSProviderResult>;
}
