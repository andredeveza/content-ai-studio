import type { CircuitBreakerConfig } from "@/config/ai";

type CircuitState = "closed" | "open" | "half-open";

interface CircuitRecord {
  state: CircuitState;
  failures: number;
  openCount: number;
  nextAttemptAt: number;
}

function initialRecord(): CircuitRecord {
  return { state: "closed", failures: 0, openCount: 0, nextAttemptAt: 0 };
}

// Circuit breaker por provider. Fechado: tenta normalmente. Aberto: pula o
// provider até nextAttemptAt. Meio-aberto: deixa uma tentativa passar; se
// falhar, reabre com cooldown maior (reabertura progressiva); se
// funcionar, fecha e zera as falhas.
export class FallbackPolicy {
  private readonly circuits = new Map<string, CircuitRecord>();

  constructor(private readonly config: CircuitBreakerConfig) {}

  canAttempt(providerId: string): boolean {
    const record = this.circuits.get(providerId);
    if (!record || record.state !== "open") return true;

    if (Date.now() >= record.nextAttemptAt) {
      record.state = "half-open";
      return true;
    }
    return false;
  }

  recordSuccess(providerId: string): void {
    this.circuits.set(providerId, initialRecord());
  }

  recordFailure(providerId: string): void {
    const record = this.circuits.get(providerId) ?? initialRecord();
    const failures = record.failures + 1;

    if (record.state === "half-open" || failures >= this.config.failureThreshold) {
      const openCount = record.openCount + 1;
      const cooldown = this.config.baseCooldownMs * 2 ** (openCount - 1);
      this.circuits.set(providerId, {
        state: "open",
        failures,
        openCount,
        nextAttemptAt: Date.now() + cooldown,
      });
      return;
    }

    this.circuits.set(providerId, { ...record, failures });
  }

  stateOf(providerId: string): CircuitState {
    return this.circuits.get(providerId)?.state ?? "closed";
  }
}
