import { describe, expect, it } from "vitest";
import { extractPdfBuffer } from "@/core/application/services/pdf-extraction.service";

// Gera um PDF de verdade com Puppeteer (já usado no bloco 5) em vez de
// escrever bytes de PDF à mão — mais confiável e reaproveita uma
// ferramenta já validada neste projeto.
async function buildTestPdf(): Promise<Buffer> {
  const { default: puppeteer } = await import("puppeteer");
  // --no-sandbox: runners de CI (GitHub Actions) rodam como root e o
  // Chrome recusa abrir sandbox nesse caso (mesma causa raiz do fix em
  // src/infra/render/puppeteer-renderer.ts).
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(`
      <html><body style="font-size:20px">
        <p>Cafe especial cafe especial cafe grao colheita direta produtor.</p>
        <p>${"Texto de enchimento para o excerto ficar dentro do intervalo esperado. ".repeat(2)}</p>
      </body></html>
    `);
    const pdf = await page.pdf({ format: "a4" });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

describe("extractPdfBuffer (bloco 7) — README: texto das primeiras páginas, termos, trechos", () => {
  it("extrai termos por frequência e trechos entre 40 e 320 caracteres de um PDF real", async () => {
    const buffer = await buildTestPdf();
    const extraction = await extractPdfBuffer(buffer);

    expect(extraction.pages).toBeGreaterThanOrEqual(1);
    expect(extraction.readPages).toBe(extraction.pages);
    expect(extraction.terms).toContain("cafe");
    expect(extraction.terms).toContain("especial");
    expect(extraction.excerpts.length).toBeGreaterThan(0);
    for (const excerpt of extraction.excerpts) {
      expect(excerpt.length).toBeGreaterThan(40);
      expect(excerpt.length).toBeLessThan(320);
    }
  }, 30_000);
});
