import { StructureSchema } from "@/core/application/dto/copy.dto";
import type { AIContext, AITextGenerator } from "@/core/domain/ports/ai-text-generator";
import { ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

// Papel POSICIONAL do slide dentro da estrutura — não confundir com
// `SlideRole` (`core/domain/template/slide-role.ts`), que é o papel
// EDITORIAL usado pelas receitas dos estilos de composição. Este aqui só
// existe para orientar o prompt do CopyService.
export type StructureRole = "abertura" | "conteudo" | "fecho";

export interface SlideBrief {
  readonly index: number;
  readonly role: StructureRole;
  readonly brief: string;
}

export interface ProjectStructure {
  readonly slides: readonly SlideBrief[];
}

function roleFor(index: number, total: number): StructureRole {
  if (index === 0) return "abertura";
  if (index === total - 1) return "fecho";
  return "conteudo";
}

// Step "research" (5% — README, "Pipeline de geração"). Só decide QUANTOS
// slides e o que cada um comunica — papel (abertura/conteúdo/fecho) é
// derivado do índice em código, nunca pedido à IA (evita o modelo errar
// a contagem ou repetir "fecho" no meio).
export class ResearchService {
  constructor(private readonly textGenerator: AITextGenerator) {}

  async buildStructure(
    theme: string,
    goal: string,
    slideCount: number,
    ctx: AIContext,
  ): Promise<Result<ProjectStructure, AppError>> {
    const prompt = [
      `Tema: ${theme}`,
      `Objetivo: ${goal}`,
      `Gere a estrutura de um carrossel de ${slideCount} slides para Instagram.`,
      `Responda só JSON no formato {"slides":[{"brief":"..."}]} com exatamente ${slideCount} itens.`,
      "Cada brief é uma frase curta descrevendo o que aquele slide deve comunicar.",
      "O primeiro slide é a abertura/gancho, o último é a chamada final.",
    ].join("\n");

    const result = await this.textGenerator.generateStructured(
      { prompt, system: "Você é um estrategista de conteúdo para redes sociais." },
      StructureSchema,
      ctx,
    );
    if (!result.ok) return result;

    if (result.value.slides.length !== slideCount) {
      return err(
        new ValidationError(
          `Esperava ${slideCount} slides na estrutura, a IA retornou ${result.value.slides.length}.`,
        ),
      );
    }

    const slides = result.value.slides.map((slide, index) => ({
      index,
      role: roleFor(index, slideCount),
      brief: slide.brief,
    }));

    return ok({ slides });
  }
}
