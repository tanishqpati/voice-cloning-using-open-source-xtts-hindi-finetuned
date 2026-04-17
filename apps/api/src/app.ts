import cors from "cors";
import express from "express";
import multer from "multer";
import { getModel, listModels } from "@tts/config";
import { getProvider } from "./providers/provider-loader";

export function createApp() {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/models", (_req, res) => {
    res.json({ models: listModels() });
  });

  app.post(
    "/generate",
    upload.single("file") as unknown as express.RequestHandler,
    async (req, res) => {
    try {
      const text = String(req.body.text || "").trim();
      const model = String(req.body.model || "").trim();
      const file = req.file;

      if (!text) {
        return res.status(400).json({ error: "text is required" });
      }

      if (!model) {
        return res.status(400).json({ error: "model is required" });
      }

      if (!file) {
        return res.status(400).json({ error: "file is required" });
      }

      const modelConfig = getModel(model);
      const provider = getProvider(model);
      const providerResult = await provider.synthesize({
        text,
        language: modelConfig.language,
        file: file.buffer,
        filename: file.originalname || "speaker.wav",
        contentType: file.mimetype || "audio/wav"
      });

      const origin = new URL(modelConfig.endpoint).origin;
      const audioUrl = providerResult.audio_url.startsWith("http")
        ? providerResult.audio_url
        : `${origin}${providerResult.audio_url}`;

      return res.json({
        audio_url: audioUrl,
        model,
        provider: modelConfig.provider
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate audio";
      return res.status(500).json({ error: message });
    }
    }
  );

  return app;
}
