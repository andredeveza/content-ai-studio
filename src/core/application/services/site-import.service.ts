import { analyzeImageBuffer } from "@/core/application/services/image-analysis.service";
import { ExternalServiceError, ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export interface SiteImportResult {
  readonly sourceUrl: string;
  // Texto de <title>/og:title/<h1>/meta description — vira sugestão de
  // tom de voz, nunca aplicado direto (README, "Importar acervo a
  // partir do site do cliente": "sempre em tela de revisão").
  readonly suggestedText: string | null;
  readonly suggestedColor: string | null;
  readonly logo: { readonly url: string; readonly bytes: Buffer; readonly contentType: string } | null;
}

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
  /^0\.0\.0\.0$/,
];

// Guarda mínima contra SSRF (README não pede explicitamente, mas
// "cola uma URL e o servidor busca" é o vetor clássico) — recusa
// protocolo != http(s) e hosts de rede interna óbvios.
export function assertPublicHttpUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ValidationError(`URL inválida: "${rawUrl}".`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ValidationError("Só URLs http:// ou https:// são aceitas.");
  }
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    throw new ValidationError("Endereço de rede interna não é aceito.");
  }
  return url;
}

function decodeEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .trim();
}

function matchAttr(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match ? decodeEntities(match[1] ?? "") : null;
}

// Porte enxuto de `SiteImportService` (README, "Importar acervo a
// partir do site do cliente"): sem Puppeteer (que só roda no serviço
// separado do Render, README "Renderização") — fetch + regex resolve
// os passos 2 ("Coleta") e 5 ("Extrai identidade") pro que a tela de
// revisão do ADENDO-02 exige (cor + texto), sem depender de JS
// renderizado no cliente. `logo`/`favicon` cobre o passo de imagem;
// cor de CSS computado e font-family de verdade exigem browser real —
// ficam para uma iteração com o serviço de render (pendência anotada
// no PROGRESSO.md).
export class SiteImportService {
  async analyze(rawUrl: string): Promise<Result<SiteImportResult, AppError>> {
    const url = assertPublicHttpUrl(rawUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let html: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "ContentAIStudioBot/1.0 (+https://content-ai-studio.vercel.app)" },
      });
      if (!response.ok) {
        return err(new ExternalServiceError(`O site respondeu ${response.status}.`, "site-import"));
      }
      html = await response.text();
    } catch (cause) {
      return err(new ExternalServiceError("Falha ao buscar o site (timeout ou rede).", "site-import", cause));
    } finally {
      clearTimeout(timeout);
    }

    const ogTitle = matchAttr(html, /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    const title = matchAttr(html, /<title[^>]*>([^<]*)<\/title>/i);
    const h1 = matchAttr(html, /<h1[^>]*>([^<]*)<\/h1>/i);
    const description = matchAttr(
      html,
      /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
    );
    const suggestedText = ogTitle || title || h1 || description || null;

    const themeColor = matchAttr(html, /<meta[^>]+name=["']theme-color["'][^>]*content=["'](#[0-9a-fA-F]{3,6})["']/i);

    const logoHref =
      matchAttr(html, /<link[^>]+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i) ??
      matchAttr(html, /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]*href=["']([^"']+)["']/i);

    let logo: SiteImportResult["logo"] = null;
    let suggestedColor = themeColor;

    if (logoHref) {
      try {
        const logoUrl = new URL(logoHref, url).toString();
        const logoResponse = await fetch(logoUrl, { signal: AbortSignal.timeout(10_000) });
        if (logoResponse.ok) {
          const contentType = logoResponse.headers.get("content-type") ?? "image/png";
          if (contentType.startsWith("image/")) {
            const bytes = Buffer.from(await logoResponse.arrayBuffer());
            logo = { url: logoUrl, bytes, contentType };
            if (!suggestedColor) {
              const analysis = await analyzeImageBuffer(bytes);
              suggestedColor = analysis.dominantColor;
            }
          }
        }
      } catch {
        // Logo é bônus (vira sugestão de cor + entra no acervo) — se
        // falhar, o import segue só com o texto extraído do HTML.
      }
    }

    return ok({ sourceUrl: url.toString(), suggestedText, suggestedColor, logo });
  }
}
