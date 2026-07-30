// Preço por 1M tokens (USD), input/output. Só cobre os modelos usados no
// MVP; modelo desconhecido custa 0 — subestimar é mais seguro que travar
// a geração por falta de tabela de preço.
const TEXT_PRICING_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "meta-llama/llama-3.3-70b-instruct:free": { input: 0, output: 0 },
};

export function estimateTextCostUsd(model: string, tokensInput: number, tokensOutput: number): number {
  const pricing = TEXT_PRICING_PER_MILLION_TOKENS[model];
  if (!pricing) return 0;
  return (tokensInput * pricing.input + tokensOutput * pricing.output) / 1_000_000;
}
