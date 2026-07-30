import "server-only";
import { createAdminClient } from "@/infra/db/supabase/admin";
import { logger } from "@/shared/logger";
import type { Capability } from "@/core/domain/ports/ai-provider";

export interface AILogEntry {
  readonly orgId: string;
  readonly userId: string | null;
  readonly provider: string;
  readonly model: string | null;
  readonly task: Capability;
  readonly status: "success" | "error";
  readonly tokensInput?: number;
  readonly tokensOutput?: number;
  readonly costUsd: number;
  readonly latencyMs: number;
  readonly fallbackFrom?: string;
  readonly error?: string;
}

export interface AILogger {
  log(entry: AILogEntry): Promise<void>;
}

// Grava com service_role: ai_logs não tem policy de insert para o role
// authenticated de propósito (ver migration 0002_ai_logs.sql).
export class SupabaseAILogger implements AILogger {
  async log(entry: AILogEntry): Promise<void> {
    const admin = createAdminClient();
    const { error } = await admin.from("ai_logs").insert({
      org_id: entry.orgId,
      user_id: entry.userId,
      provider: entry.provider,
      model: entry.model,
      task: entry.task,
      status: entry.status,
      tokens_input: entry.tokensInput ?? null,
      tokens_output: entry.tokensOutput ?? null,
      cost_usd: entry.costUsd,
      latency_ms: entry.latencyMs,
      fallback_from: entry.fallbackFrom ?? null,
      error: entry.error ?? null,
    });

    if (error) {
      logger.error("Falha ao gravar ai_logs", { error: error.message, provider: entry.provider });
    }
  }
}
