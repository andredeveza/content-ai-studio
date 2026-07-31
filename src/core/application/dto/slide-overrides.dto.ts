import { z } from "zod";
import { ALL_ARCHETYPE_IDS } from "@/templates/blueprints";
import type { ArchetypeId } from "@/core/domain/template/blueprint";

const [firstArchetype, ...restArchetypes] = ALL_ARCHETYPE_IDS as [ArchetypeId, ...ArchetypeId[]];

// Patch parcial vindo do Editor (bloco 8) — cada campo é opcional porque
// o inspector salva só o que o usuário mexeu naquele momento
// (título/corpo, variante, mídia); UpdateSlideOverridesUseCase mescla
// com o que já existia.
export const SlideOverridesPatchSchema = z.object({
  archetypeId: z.enum([firstArchetype, ...restArchetypes]).optional(),
  texts: z.record(z.string(), z.string()).optional(),
  media: z.record(z.string(), z.string()).optional(),
});

export type SlideOverridesPatchInput = z.infer<typeof SlideOverridesPatchSchema>;
