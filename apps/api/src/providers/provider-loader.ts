import { getModel } from "@tts/config";
import { PythonTTSProvider } from "./python-provider";
import type { TTSProvider } from "./types";

export function getProvider(modelName: string): TTSProvider {
  const config = getModel(modelName);

  if (config.type === "python") {
    return new PythonTTSProvider(config);
  }

  throw new Error(`Unsupported provider type: ${config.type}`);
}
