import type { EngineLine } from "@/lib/engine";
import type { BotLevelConfig } from "./levels";

/**
 * Sceglie la mossa del bot tra le linee candidate del motore, in modo
 * probabilistico. Funzione PURA: date le stesse linee, la stessa config e lo
 * stesso rng, restituisce sempre la stessa mossa. La casualità è iniettata
 * tramite `rng` per essere testabile.
 *
 * Metodo: softmax sui punteggi (dal punto di vista del lato al tratto) con
 * temperatura `config.temperature`. Temperatura alta → scelta quasi uniforme
 * (principiante); temperatura bassa → quasi sempre la mossa migliore.
 *
 * @returns la mossa scelta in notazione UCI, o `null` se non ci sono candidate.
 */
export function selectBotMove(
  lines: EngineLine[],
  config: BotLevelConfig,
  rng: () => number,
): string | null {
  const candidates = lines.filter((line) => line.moveUci.length >= 4);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!.moveUci;

  const temperature = Math.max(1, config.temperature);
  const best = Math.max(...candidates.map((line) => line.scoreCp));

  // Pesi softmax numericamente stabili (sottraendo il massimo).
  const weights = candidates.map((line) => Math.exp((line.scoreCp - best) / temperature));
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  let threshold = rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    threshold -= weights[i]!;
    if (threshold <= 0) return candidates[i]!.moveUci;
  }
  // Fallback per arrotondamenti in virgola mobile: la migliore.
  return candidates[0]!.moveUci;
}
