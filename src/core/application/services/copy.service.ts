import { ProjectCopySchema, type ProjectCopy } from "@/core/application/dto/copy.dto";
import type { ProjectStructure } from "@/core/application/services/research.service";
import type { AIContext, AITextGenerator } from "@/core/domain/ports/ai-text-generator";
import { ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

// Step "copy" (20%). Pede um envelope genérico por slide (README, DTO
// `GenericSlideCopySchema`) — campos que não se aplicam ao papel daquele
// slide vêm vazios. O slide-content-mapper.ts decide, depois do
// SelectLayout, quais desses campos viram o `SlideContent` do arquétipo
// escolhido.
export class CopyService {
  constructor(private readonly textGenerator: AITextGenerator) {}

  async write(
    structure: ProjectStructure,
    persona: string | null,
    tone: readonly string[],
    ctx: AIContext,
  ): Promise<Result<ProjectCopy, AppError>> {
    const briefs = structure.slides.map((slide) => `${slide.index}. [${slide.role}] ${slide.brief}`).join("\n");
    const toneLine = tone.length > 0 ? `Tom de voz: ${tone.join(", ")}.` : "";
    const personaLine = persona ? `Persona da marca: ${persona}.` : "";

    const prompt = [
      "Escreva o copy de um carrossel de Instagram a partir destes slides:",
      briefs,
      personaLine,
      toneLine,
      "Para CADA slide, preencha um objeto com: index, kicker, heading (obrigatório), lead, body",
      "(frase principal — usada para detectar se é citação, dado numérico, data ou lista),",
      "quote, author, number, items (3 a 5 itens curtos quando fizer sentido), day, month,",
      "detail, ctaLabel. Deixe vazio (\"\" ou []) o que não se aplicar àquele slide.",
      "Depois preencha, para o carrossel inteiro: caption (legenda do post), hashtags",
      "(lista de palavras sem #) e cta (chamada para ação final).",
      'Responda só JSON: {"slides":[...],"caption":"...","hashtags":["..."],"cta":"..."}',
    ]
      .filter(Boolean)
      .join("\n");

    const result = await this.textGenerator.generateStructured(
      { prompt, system: "Você é um redator de conteúdo para redes sociais." },
      ProjectCopySchema,
      ctx,
    );
    if (!result.ok) return result;

    if (result.value.slides.length !== structure.slides.length) {
      return err(
        new ValidationError(
          `Esperava copy para ${structure.slides.length} slides, a IA retornou ${result.value.slides.length}.`,
        ),
      );
    }

    return ok(result.value);
  }
}
