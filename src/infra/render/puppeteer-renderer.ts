import "server-only";
import type { Browser } from "puppeteer-core";
import puppeteerCore from "puppeteer-core";
import type { RenderInput, RenderOutput, RenderPort } from "@/core/domain/ports/render";
import { logger } from "@/shared/logger";

// Roda em serviço separado no Render.com — a Vercel não sustenta Chromium
// (README, "Renderização"). Em produção usa `puppeteer-core` +
// `@sparticuz/chromium` (binário Linux enxuto o bastante para o plano
// grátis de 512MB, com `--no-sandbox --single-process`). Em dev/test usa
// o Chromium baixado pelo pacote `puppeteer` (devDependency) — não
// existe em `node_modules` num build de produção (`npm ci --omit=dev`),
// então o import dinâmico abaixo nunca roda lá.
async function launchBrowser(): Promise<Browser> {
  if (process.env.NODE_ENV === "production") {
    const { default: chromium } = await import("@sparticuz/chromium");
    return puppeteerCore.launch({
      args: [...chromium.args, "--no-sandbox", "--single-process"],
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // `--no-sandbox` também aqui: runners de CI (GitHub Actions) rodam como
  // root, e o sandbox do Chrome recusa iniciar nesse caso — sem isso,
  // puppeteer-renderer.test.ts (que sobe um browser de verdade) falha só
  // em CI, nunca localmente.
  const { default: puppeteer } = await import("puppeteer");
  return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) as unknown as Promise<Browser> as unknown as Browser;
}

// Espera fontes (`document.fonts.ready`) e imagens antes do screenshot —
// sem isso o PNG sai com texto no fallback font ou imagem em branco
// (README, "Renderização", passo 2).
const WAIT_FOR_ASSETS = `
  Promise.all([
    document.fonts.ready,
    Promise.all(Array.from(document.images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    })),
  ])
`;

export class PuppeteerRenderer implements RenderPort {
  private browserPromise: Promise<Browser> | undefined;

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = launchBrowser();
    }
    return this.browserPromise;
  }

  async screenshot(input: RenderInput): Promise<RenderOutput> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: input.width, height: input.height });
      await page.setContent(input.html, { waitUntil: "load" });
      await page.evaluate(WAIT_FOR_ASSETS);

      const png = await page.screenshot({ type: "png" });
      return { png: Buffer.from(png) };
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (!this.browserPromise) return;
    try {
      const browser = await this.browserPromise;
      await browser.close();
    } catch (cause) {
      logger.warn("Falha ao fechar o browser do PuppeteerRenderer", {
        error: cause instanceof Error ? cause.message : String(cause),
      });
    } finally {
      this.browserPromise = undefined;
    }
  }
}
