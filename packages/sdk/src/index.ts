export interface GenerateRequest {
  text: string;
  model: string;
  file: File;
}

export interface GenerateResponse {
  audio_url: string;
  model: string;
  provider: string;
}

export interface ListModelsResponse {
  models: Array<{
    id: string;
    provider: string;
    type: string;
    endpoint: string;
    language: string;
    huggingface_id?: string;
  }>;
}

export class TTSApiClient {
  constructor(private readonly baseUrl = "") {}

  async listModels(): Promise<ListModelsResponse> {
    const res = await fetch(`${this.baseUrl}/api/models`);
    if (!res.ok) {
      throw new Error("Failed to fetch models");
    }
    return (await res.json()) as ListModelsResponse;
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const formData = new FormData();
    formData.append("text", request.text);
    formData.append("model", request.model);
    formData.append("file", request.file);

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      body: formData
    });
    const data = (await res.json()) as GenerateResponse & { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Failed to generate audio");
    }
    return data;
  }
}
