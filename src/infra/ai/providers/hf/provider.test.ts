import { afterEach, describe, expect, it, vi } from "vitest";
import { HuggingFaceProvider } from "@/infra/ai/providers/hf/provider";
import type { StoragePort, UploadInput } from "@/core/domain/ports/storage";

class FakeStorage implements StoragePort {
  readonly uploaded: UploadInput[] = [];
  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    this.uploaded.push(input);
    return { path: input.path, publicUrl: `https://storage.local/media/${input.path}` };
  }
  async remove(): Promise<void> {}
  getPublicUrl(path: string): string {
    return `https://storage.local/media/${path}`;
  }
  async download(): Promise<Buffer> {
    return Buffer.from("");
  }
}

describe("HuggingFaceProvider (pendência crítica #1 — geração real de imagem)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sobe os bytes da imagem no Storage e devolve a URL pública", async () => {
    const imageBytes = new Uint8Array([1, 2, 3, 4]);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: async () => imageBytes.buffer,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const storage = new FakeStorage();
    const provider = new HuggingFaceProvider({ apiKey: "hf_test", storage, imageModel: "org/model-teste" });

    const result = await provider.generateImage({ prompt: "uma maçã vermelha numa mesa branca" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://router.huggingface.co/hf-inference/models/org/model-teste",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.model).toBe("org/model-teste");
    expect(result.imageUrl).toContain("ai-generated/");
    expect(storage.uploaded[0]?.contentType).toBe("image/jpeg");
  });

  it("lança ExternalServiceError quando a API responde erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
        text: async () => "modelo carregando",
      })),
    );

    const provider = new HuggingFaceProvider({ apiKey: "hf_test", storage: new FakeStorage() });
    await expect(provider.generateImage({ prompt: "qualquer coisa" })).rejects.toThrow(/503/);
  });

  it("lança ExternalServiceError quando a resposta não é uma imagem", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => '{"error":"modelo indisponível"}',
      })),
    );

    const provider = new HuggingFaceProvider({ apiKey: "hf_test", storage: new FakeStorage() });
    await expect(provider.generateImage({ prompt: "qualquer coisa" })).rejects.toThrow(/não retornou uma imagem/);
  });

  it("generateText/analyzeImage/embed ainda não são suportados", async () => {
    const provider = new HuggingFaceProvider({ apiKey: "hf_test", storage: new FakeStorage() });
    expect(provider.capabilities).toEqual(["image"]);
    await expect(provider.generateText({ prompt: "x" })).rejects.toThrow();
    await expect(provider.embed({ text: "x" })).rejects.toThrow();
  });
});
