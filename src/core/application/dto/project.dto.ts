import { z } from "zod";

export const StartProjectSchema = z.object({
  orgId: z.string().uuid(),
  clientId: z.string().uuid(),
  theme: z.string().trim().min(1, "Tema é obrigatório"),
  goal: z.enum(["educar", "autoridade", "converter", "mito"]),
  slideCount: z.number().int().min(6).max(8),
  ratio: z.enum(["4:5", "1:1", "9:16"]).default("4:5"),
});

export type StartProjectInput = z.input<typeof StartProjectSchema>;
