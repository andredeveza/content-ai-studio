import { z } from "zod";
import { DEFAULT_STYLE_SLUG, STYLE_SLUGS } from "@/core/domain/template/composition-styles.catalog";

export const StartProjectSchema = z
  .object({
    orgId: z.string().uuid(),
    clientId: z.string().uuid(),
    theme: z.string().trim().min(1, "Tema é obrigatório"),
    goal: z.enum(["educar", "autoridade", "converter", "mito"]),
    // Post único tem 1 slide; carrossel, de 6 a 8 (refinado no superRefine
    // abaixo, junto com `format`).
    slideCount: z.number().int().min(1).max(8),
    ratio: z.enum(["4:5", "1:1", "9:16"]).default("4:5"),
    // Validado contra o catálogo, não contra uma lista solta: acrescentar
    // um nono estilo não exige tocar aqui.
    styleId: z
      .string()
      .refine((slug) => STYLE_SLUGS.includes(slug), { message: "Estilo de composição desconhecido" })
      .default(DEFAULT_STYLE_SLUG),
    format: z.enum(["carousel", "single"]).default("carousel"),
    // Campo "cta" do protótipo do Gerador. Vazio = usa o CTA padrão do
    // Brand Kit do cliente.
    cta: z.string().trim().default(""),
  })
  .superRefine((value, ctx) => {
    // README: post único e carrossel "não são o mesmo pipeline com
    // contagem diferente" — a contagem tem que bater com o formato.
    if (value.format === "single" && value.slideCount !== 1) {
      ctx.addIssue({ code: "custom", path: ["slideCount"], message: "Post único tem exatamente 1 slide" });
    }
    if (value.format === "carousel" && (value.slideCount < 6 || value.slideCount > 8)) {
      ctx.addIssue({ code: "custom", path: ["slideCount"], message: "Carrossel tem de 6 a 8 slides" });
    }
  });

export type StartProjectInput = z.input<typeof StartProjectSchema>;
