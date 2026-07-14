import { MATE_SCORE } from "@/lib/types";
import type { EngineLine } from "./types";

/**
 * Converte un punteggio di matto (numero di mosse) in centipawn convenzionali.
 * Più il matto è vicino, più il valore assoluto è alto.
 */
export function mateToCp(mate: number): number {
  const sign = mate >= 0 ? 1 : -1;
  return sign * (MATE_SCORE - Math.abs(mate));
}

/**
 * Interpreta una riga UCI `info ...` prodotta da Stockfish e ne estrae la
 * linea (rank MultiPV, punteggio, matto, mossa, pv). Restituisce `null` se la
 * riga non contiene informazioni di valutazione utili (es. manca `pv`).
 *
 * Funzione pura: nessuna dipendenza dal Worker, quindi testabile.
 */
export function parseInfoLine(line: string): EngineLine | null {
  if (!line.startsWith("info ") || !line.includes(" pv ")) return null;

  const tokens = line.split(/\s+/);
  let rank = 1;
  let scoreCp: number | null = null;
  let mate: number | null = null;
  let pv: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "multipv") {
      rank = Number(tokens[i + 1]) || 1;
    } else if (token === "score") {
      const kind = tokens[i + 1];
      const value = Number(tokens[i + 2]);
      if (kind === "cp") {
        scoreCp = value;
      } else if (kind === "mate") {
        mate = value;
        scoreCp = mateToCp(value);
      }
    } else if (token === "pv") {
      pv = tokens.slice(i + 1);
      break;
    }
  }

  if (pv.length === 0 || scoreCp === null) return null;
  const first = pv[0];
  if (!first) return null;

  return { rank, moveUci: first, scoreCp, mate, pv };
}
