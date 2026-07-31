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
  // Import dinâmico de propósito: `pdf-parse` quebra a build de Server
  // Components com "Object.defineProperty called on non-object" se
  // entrar no grafo de módulos avaliado no carregamento de uma
  // page.tsx (mesmo transitivo, via uma server action vinculada —
  // Next.js empacota o módulo inteiro de uma action bindada num
  // Server Component, não só o de quem a chama). Import estático no
  // topo do arquivo já causou isso (ver PROGRESSO.md); dinâmico adia a
  // avaliação real do pacote para quando a função roda de verdade
  // (dentro de uma server action, nunca durante o render da página).
  const { PDFParse } = await import("pdf-parse");
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
