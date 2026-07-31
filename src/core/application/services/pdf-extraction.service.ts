import { PDFParse } from "pdf-parse";
import { splitExcerpts, topTermsByFrequency } from "@/core/application/services/text-tokens";

// Porte quase literal de `analyzePdf()` em
// design/Acervo Inteligente.dc.html: lê o texto das primeiras páginas,
// termos por frequência, trechos entre 40 e 320 caracteres (README,
// "Extração" > PDF). Troca pdf.js no navegador por `pdf-parse`
// (pdf.js por baixo) no servidor.
const MAX_PAGES_READ = 4;

export interface PdfExtraction {
  readonly pages: number;
  readonly readPages: number;
  readonly terms: readonly string[];
  readonly excerpts: readonly string[];
}

export async function extractPdfBuffer(buffer: Buffer): Promise<PdfExtraction> {
  const parser = new PDFParse({ data: buffer });
  try {
    const info = await parser.getInfo();
    const readPages = Math.min(info.total, MAX_PAGES_READ);
    const textResult = await parser.getText({ first: readPages });

    return {
      pages: info.total,
      readPages,
      terms: topTermsByFrequency(textResult.text),
      excerpts: splitExcerpts(textResult.text),
    };
  } finally {
    await parser.destroy();
  }
}
