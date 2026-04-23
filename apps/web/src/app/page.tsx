"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

interface ModelEntry {
  id: string;
  provider: string;
  type: string;
  endpoint: string;
  language: string;
  huggingface_id?: string;
}

type InputMode = "upload" | "record";

export default function HomePage() {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [text, setText] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function loadModels() {
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        const available = (data.models || []) as ModelEntry[];
        setModels(available);
        if (available.length > 0) setSelectedModel(available[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load models");
      }
    }
    loadModels();
  }, []);

  async function startRecording() {
    setError("");
    setRecordedBlob(null);
    setRecordedUrl("");
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied. Please allow microphone and try again.");
      return;
    }

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
    };

    recorder.start();
    setRecording(true);
    setRecordingSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function clearRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl("");
    setRecordingSeconds(0);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setAudioUrl("");

    if (!text.trim()) { setError("Please enter text to synthesize."); return; }
    if (!selectedModel) { setError("Please select a model."); return; }

    const speakerFile =
      inputMode === "upload"
        ? audioFile
        : recordedBlob
        ? new File([recordedBlob], "recording.webm", { type: recordedBlob.type })
        : null;

    if (!speakerFile) {
      setError(
        inputMode === "upload"
          ? "Please upload a speaker sample file."
          : "Please record a speaker sample first."
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("model", selectedModel);
      formData.append("file", speakerFile);

      const response = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");
      setAudioUrl(data.audio_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main>
      <h1>Hindi Voice Cloning Platform</h1>
      <p>Provide a 30–60 second speaker sample, enter text, and generate speech.</p>

      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>Speaker Sample</legend>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
            <label>
              <input
                type="radio"
                name="inputMode"
                value="upload"
                checked={inputMode === "upload"}
                onChange={() => setInputMode("upload")}
              />{" "}
              Upload file
            </label>
            <label>
              <input
                type="radio"
                name="inputMode"
                value="record"
                checked={inputMode === "record"}
                onChange={() => setInputMode("record")}
              />{" "}
              Record now
            </label>
          </div>

          {inputMode === "upload" ? (
            <input
              id="speakerFile"
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {!recording ? (
                  <button type="button" onClick={startRecording} disabled={!!recordedBlob}>
                    🎙 Start Recording
                  </button>
                ) : (
                  <button type="button" onClick={stopRecording}>
                    ⏹ Stop ({formatTime(recordingSeconds)})
                  </button>
                )}
                {recordedBlob && !recording && (
                  <button type="button" onClick={clearRecording}>
                    ✕ Discard
                  </button>
                )}
              </div>
              {recording && (
                <p style={{ color: "red", margin: 0 }}>
                  ● Recording… {formatTime(recordingSeconds)}
                </p>
              )}
              {recordedUrl && (
                <audio controls src={recordedUrl} style={{ marginTop: "0.25rem" }} />
              )}
            </div>
          )}
        </fieldset>

        <label htmlFor="model">Model</label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
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
          onChange={(e) => setText(e.target.value)}
        />

        {error ? <p style={{ color: "red" }}>{error}</p> : null}

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
