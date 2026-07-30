import { z } from "zod";

// Saída do ResearchService (step "research", 5%): um brief curto por
// slide. O papel (abertura/conteúdo/fecho) é derivado do índice depois,
// não pedido à IA — evita que o modelo erre a contagem de papéis.
export const StructureSchema = z.object({
  slides: z.array(z.object({ brief: z.string().trim().min(1) })).min(1),
});

export type Structure = z.infer<typeof StructureSchema>;

// Saída do CopyService (step "copy", 20%): um envelope genérico por
// slide com todos os campos que algum arquétipo pode precisar. Campos
// que não se aplicam ao papel daquele slide vêm vazios — o
// slide-content-mapper.ts decide quais usar depois que o SelectLayout
// (bloco 4) escolhe o arquétipo a partir de `body`.
export const GenericSlideCopySchema = z.object({
  index: z.number().int().min(0),
  kicker: z.string().trim().default(""),
  heading: z.string().trim().min(1),
  lead: z.string().trim().default(""),
  body: z.string().trim().default(""),
  quote: z.string().trim().default(""),
  author: z.string().trim().default(""),
  number: z.string().trim().default(""),
  items: z.array(z.string().trim().min(1)).default([]),
  day: z.string().trim().default(""),
  month: z.string().trim().default(""),
  detail: z.string().trim().default(""),
  ctaLabel: z.string().trim().default(""),
});

export type GenericSlideCopy = z.infer<typeof GenericSlideCopySchema>;

export const ProjectCopySchema = z.object({
  slides: z.array(GenericSlideCopySchema).min(1),
  caption: z.string().trim().min(1),
  hashtags: z.array(z.string().trim().min(1)).min(1),
  cta: z.string().trim().min(1),
});

export type ProjectCopy = z.infer<typeof ProjectCopySchema>;
