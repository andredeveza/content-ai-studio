import { StructureSchema } from "@/core/application/dto/copy.dto";
import type { SlideRole } from "@/core/domain/template/slide-role";
import type { ProjectFormat } from "@/core/domain/project/project";
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
  // Papel EDITORIAL sugerido pela IA (capa · argumento · dado · citação ·
  // prova · fecho) — é o que o estilo de composição usa para escolher a
  // receita de layout. Ausente quando o modelo não devolveu um papel
  // válido; o planejador cai em "argumento".
  readonly slideRole?: SlideRole;
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

function normalizeSlideRole(role: SlideRole | undefined, index: number, total: number): SlideRole {
  if (index === 0) return "capa";
  if (index === total - 1) return "fecho";
  // Modelo devolvendo "capa"/"fecho" no miolo é erro comum — vira
  // "argumento", que é o papel neutro do meio do carrossel.
  if (!role || role === "capa" || role === "fecho") return "argumento";
  return role;
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
    format: ProjectFormat = "carousel",
  ): Promise<Result<ProjectStructure, AppError>> {
    // README, estilo 08: post único "não é o mesmo pipeline com contagem
    // diferente" — o corpo do conteúdo vive na legenda, então o brief
    // pede uma imagem-manchete só, não uma sequência.
    const prompt = [
      `Tema: ${theme}`,
      `Objetivo: ${goal}`,
      format === "single"
        ? "Gere a estrutura de um POST ÚNICO de Instagram: exatamente 1 item, que é a arte de capa. O conteúdo desenvolvido vai na legenda, não na imagem."
        : `Gere a estrutura de um carrossel de ${slideCount} slides para Instagram.`,
      `Responda só JSON no formato {"slides":[{"brief":"...","role":"..."}]} com exatamente ${slideCount} itens.`,
      "Cada brief é uma frase curta descrevendo o que aquele slide deve comunicar.",
      format === "single"
        ? "O único item é a capa: manchete curta e forte, nada de corpo de texto longo."
        : "O primeiro slide é a abertura/gancho, o último é a chamada final.",
      'O campo "role" é o papel editorial do slide, um de: capa, argumento, dado, citacao, prova, fecho.',
      '"dado" só quando houver número/percentual; "citacao" só com fala de alguém; "prova" para caso real, bastidor ou foto do cliente.',
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
      // Posição manda: capa e fecho são derivados do índice, nunca do
      // que o modelo respondeu.
      slideRole: normalizeSlideRole(slide.role, index, slideCount),
      brief: slide.brief,
    }));

    return ok({ slides });
  }
}
