import { z } from "zod";

// Sempre com timezone (Z ou offset) — quem chama converte antes de
// enviar (ex.: `new Date(valorDoInput).toISOString()` no cliente).
export const SchedulePostSchema = z.object({
  scheduledAt: z.iso.datetime({ offset: true }),
});

export type SchedulePostInput = z.infer<typeof SchedulePostSchema>;
