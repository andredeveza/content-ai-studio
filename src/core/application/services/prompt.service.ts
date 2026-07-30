import type { GenericSlideCopy } from "@/core/application/dto/copy.dto";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";

// Step "prompt" (40%). Monta o prompt de geração de imagem para os
// slides cujo arquétipo tem slot de mídia — sem chamada de IA aqui, só
// monta o texto que o ImageService manda pro AIGateway.
export class PromptService {
  buildPrompt(brandKit: BrandKit, slideCopy: GenericSlideCopy): string {
    const style = brandKit.imageStyle ? `Estilo: ${brandKit.imageStyle}. ` : "";
    const subject = slideCopy.body || slideCopy.heading;
    return `${style}Fotografia para post de Instagram sobre: ${slideCopy.heading}. ${subject}`.trim();
  }
}
