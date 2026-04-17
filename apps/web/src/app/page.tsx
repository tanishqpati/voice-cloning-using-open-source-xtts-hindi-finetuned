"use client";

import { FormEvent, useEffect, useState } from "react";

interface ModelEntry {
  id: string;
  provider: string;
  type: string;
  endpoint: string;
  language: string;
  huggingface_id?: string;
}

export default function HomePage() {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [text, setText] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadModels() {
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        const available = (data.models || []) as ModelEntry[];
        setModels(available);
        if (available.length > 0) {
          setSelectedModel(available[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load models");
      }
    }

    loadModels();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setAudioUrl("");

    if (!text.trim()) {
      setError("Please enter text to synthesize.");
      return;
    }
    if (!selectedModel) {
      setError("Please select a model.");
      return;
    }
    if (!audioFile) {
      setError("Please upload a speaker sample file.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("model", selectedModel);
      formData.append("file", audioFile);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setAudioUrl(data.audio_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Hindi Voice Cloning Platform</h1>
      <p>Upload a 30-60 second sample, enter text, and generate speech.</p>

      <form onSubmit={onSubmit}>
        <label htmlFor="speakerFile">Speaker Sample (WAV/MP3)</label>
        <input
          id="speakerFile"
          type="file"
          accept="audio/*"
          onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
        />

        <label htmlFor="model">Model</label>
        <select
          id="model"
          value={selectedModel}
          onChange={(event) => setSelectedModel(event.target.value)}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.id} ({model.provider})
            </option>
          ))}
        </select>

        <label htmlFor="text">Input Text</label>
        <textarea
          id="text"
          rows={5}
          placeholder="अपना टेक्स्ट यहां लिखें..."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {audioUrl ? (
        <section>
          <h2>Generated Output</h2>
          <audio controls src={audioUrl} />
        </section>
      ) : null}
    </main>
  );
}
