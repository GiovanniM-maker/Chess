/**
 * Generatore pseudo-casuale deterministico (mulberry32).
 * Un seme fisso rende i test riproducibili; un seme per-partita dà varietà
 * tra partite diverse. Restituisce una funzione che produce numeri in [0, 1).
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
