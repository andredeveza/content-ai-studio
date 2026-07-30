import { z } from "zod";

export const CreateClientSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().trim().min(1, "Nome é obrigatório"),
  handles: z.array(z.string().trim().min(1)).default([]),
  persona: z.string().trim().min(1).nullable().default(null),
  tone: z.array(z.string().trim().min(1)).default([]),
  goals: z.array(z.string().trim().min(1)).default([]),
  specialties: z.array(z.string().trim().min(1)).default([]),
  site: z.string().trim().url().nullable().default(null),
});

// z.input (não z.output): os campos com `.default()` continuam opcionais
// na assinatura do use-case — quem chama não precisa preenchê-los, o
// parse é que aplica o default.
export type CreateClientInput = z.input<typeof CreateClientSchema>;

export const UpdateClientSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").optional(),
  handles: z.array(z.string().trim().min(1)).optional(),
  persona: z.string().trim().min(1).nullable().optional(),
  tone: z.array(z.string().trim().min(1)).optional(),
  goals: z.array(z.string().trim().min(1)).optional(),
  specialties: z.array(z.string().trim().min(1)).optional(),
  site: z.string().trim().url().nullable().optional(),
});

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
