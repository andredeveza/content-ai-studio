import "server-only";
import { createAdminClient } from "@/infra/db/supabase/admin";
import { RateLimitError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";
import type { RateLimitBudgets } from "@/config/ai";

export interface RateLimitScopeContext {
  readonly orgId: string;
  readonly userId: string | null;
  readonly providerId: string;
}

export interface RateLimiter {
  checkBudget(ctx: RateLimitScopeContext): Promise<Result<void, RateLimitError>>;
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

// Três camadas independentes (README, seção "Segurança"): usuário, org e
// provedor, cada uma com seu próprio orçamento mensal em ai_logs.cost_usd.
// Estourar qualquer uma bloqueia a chamada, mesmo que as outras estejam ok.
export class SupabaseRateLimiter implements RateLimiter {
  constructor(private readonly budgets: RateLimitBudgets) {}

  async checkBudget(ctx: RateLimitScopeContext): Promise<Result<void, RateLimitError>> {
    const admin = createAdminClient();
    const since = startOfMonthIso();

    const scopes: { scope: "user" | "org" | "provider"; column: "user_id" | "org_id" | "provider"; value: string | null; limit: number }[] = [
      { scope: "user", column: "user_id", value: ctx.userId, limit: this.budgets.perUserMonthlyUsd },
      { scope: "org", column: "org_id", value: ctx.orgId, limit: this.budgets.perOrgMonthlyUsd },
      { scope: "provider", column: "provider", value: ctx.providerId, limit: this.budgets.perProviderMonthlyUsd },
    ];

    for (const { scope, column, value, limit } of scopes) {
      if (!value) continue;

      const { data, error } = await admin
        .from("ai_logs")
        .select("cost_usd")
        .eq(column, value)
        .gte("created_at", since);

      if (error) continue; // falha ao consultar não deve bloquear geração

      const spent = (data ?? []).reduce((total, row) => total + Number(row.cost_usd), 0);
      if (spent >= limit) {
        return err(
          new RateLimitError(
            `Orçamento mensal de IA excedido (${scope}): US$${spent.toFixed(2)} de US$${limit.toFixed(2)}.`,
            scope,
          ),
        );
      }
    }

    return ok(undefined);
  }
}
