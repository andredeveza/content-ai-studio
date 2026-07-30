export interface RenderInput {
  readonly html: string;
  readonly width: number;
  readonly height: number;
}

export interface RenderOutput {
  readonly png: Buffer;
}

// Roda em serviço separado no Render.com (a Vercel não sustenta Chromium
// — README, seção "Renderização"). A implementação concreta
// (infra/render/puppeteer-renderer.ts) abre o HTML, espera fontes e
// imagens e tira o screenshot; esta porta é o que o domínio conhece.
export interface RenderPort {
  screenshot(input: RenderInput): Promise<RenderOutput>;
}
