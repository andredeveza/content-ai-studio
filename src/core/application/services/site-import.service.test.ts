import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteImportService, assertPublicHttpUrl } from "@/core/application/services/site-import.service";

const HTML_WITH_THEME_COLOR = `
<!doctype html>
<html><head>
  <title>AD Tráfego Digital &amp; Growth</title>
  <meta name="theme-color" content="#0A47A8">
  <meta name="description" content="Agência de tráfego pago.">
  <link rel="icon" href="/favicon.png">
</head><body><h1>Marketing de verdade</h1></body></html>
`;

const HTML_WITHOUT_THEME_COLOR = `
<!doctype html>
<html><head>
  <meta property="og:title" content="Clínica Bem Estar">
  <link rel="apple-touch-icon" href="/logo-192.png">
</head><body></body></html>
`;

// PNG real (gerado pelo próprio sharp, não bytes escritos à mão) —
// analyzeImageBuffer decodifica pixel de verdade (resize + raw), então
// precisa de um PNG genuinamente válido, não só um cabeçalho válido.
async function fakeImagePng(): Promise<ArrayBuffer> {
  const buffer = await sharp({
    create: { width: 8, height: 8, channels: 3, background: { r: 10, g: 71, b: 168 } },
  })
    .png()
    .toBuffer();
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

describe("assertPublicHttpUrl (guarda de SSRF)", () => {
  it("aceita URL http(s) pública", () => {
    expect(() => assertPublicHttpUrl("https://exemplo.com.br/pagina")).not.toThrow();
  });

  it("rejeita protocolo diferente de http/https", () => {
    expect(() => assertPublicHttpUrl("file:///etc/passwd")).toThrow(/http/);
  });

  it("rejeita host de rede interna", () => {
    expect(() => assertPublicHttpUrl("http://localhost:3000/admin")).toThrow(/rede interna/);
    expect(() => assertPublicHttpUrl("http://127.0.0.1/admin")).toThrow(/rede interna/);
    expect(() => assertPublicHttpUrl("http://192.168.1.10/admin")).toThrow(/rede interna/);
  });

  it("rejeita URL malformada", () => {
    expect(() => assertPublicHttpUrl("nem-uma-url")).toThrow(/inválida/);
  });
});

describe("SiteImportService (README, 'Importar acervo a partir do site do cliente')", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extrai theme-color, título e favicon do HTML", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const href = url.toString();
      if (href.endsWith("/favicon.png")) {
        return {
          ok: true,
          headers: new Headers({ "content-type": "image/png" }),
          arrayBuffer: async () => fakeImagePng(),
        };
      }
      return { ok: true, text: async () => HTML_WITH_THEME_COLOR };
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new SiteImportService();
    const result = await service.analyze("https://ad-trafego-digital.com.br");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.suggestedText).toBe("AD Tráfego Digital & Growth");
    expect(result.value.suggestedColor).toBe("#0A47A8");
    expect(result.value.logo?.url).toBe("https://ad-trafego-digital.com.br/favicon.png");
  });

  it("sem theme-color, extrai a cor dominante do favicon", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const href = url.toString();
      if (href.endsWith("/logo-192.png")) {
        return {
          ok: true,
          headers: new Headers({ "content-type": "image/png" }),
          arrayBuffer: async () => fakeImagePng(),
        };
      }
      return { ok: true, text: async () => HTML_WITHOUT_THEME_COLOR };
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new SiteImportService();
    const result = await service.analyze("https://clinica.com.br");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.suggestedText).toBe("Clínica Bem Estar");
    expect(result.value.suggestedColor).toBe("#0a47a8");
    expect(result.value.logo).not.toBeNull();
  });

  it("propaga erro quando o site responde com status de erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404 })),
    );

    const service = new SiteImportService();
    const result = await service.analyze("https://naoexiste.com.br");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toMatch(/404/);
  });

  it("recusa URL de rede interna antes de qualquer fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const service = new SiteImportService();
    await expect(service.analyze("http://localhost/admin")).rejects.toThrow(/rede interna/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
