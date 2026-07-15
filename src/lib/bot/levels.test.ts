import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { BOT_LEVELS, BOT_LEVEL_LIST, resolveBotLevel, toBotLevelId } from "./levels";
import { randomLegalMove } from "./select-move";
import { createRng } from "./rng";

describe("livelli del bot (0-10)", () => {
  it("espone 11 livelli con id coerenti", () => {
    expect(BOT_LEVEL_LIST).toHaveLength(11);
    BOT_LEVEL_LIST.forEach((config, index) => expect(config.id).toBe(index));
  });

  it("la forza cresce con il livello: profondità su, casualità giù", () => {
    for (let i = 1; i <= 10; i++) {
      const prev = BOT_LEVELS[(i - 1) as keyof typeof BOT_LEVELS];
      const curr = BOT_LEVELS[i as keyof typeof BOT_LEVELS];
      expect(curr.depth).toBeGreaterThanOrEqual(prev.depth);
      expect(curr.temperature).toBeLessThanOrEqual(prev.temperature);
      expect(curr.randomMoveChance).toBeLessThanOrEqual(prev.randomMoveChance);
    }
  });

  it("toBotLevelId limita i valori all'intervallo 0-10", () => {
    expect(toBotLevelId(-3)).toBe(0);
    expect(toBotLevelId(4.6)).toBe(5);
    expect(toBotLevelId(99)).toBe(10);
  });

  it("resolveBotLevel mappa gli id legacy delle partite salvate", () => {
    expect(resolveBotLevel("beginner-absolute").id).toBe(0);
    expect(resolveBotLevel("beginner").id).toBe(2);
    expect(resolveBotLevel("amateur").id).toBe(5);
    expect(resolveBotLevel(7).id).toBe(7);
    expect(resolveBotLevel("sconosciuto").id).toBe(2);
    expect(resolveBotLevel(undefined).id).toBe(2);
  });
});

describe("randomLegalMove", () => {
  it("restituisce sempre una mossa legale", () => {
    const fen = new Chess().fen();
    const rng = createRng(5);
    for (let i = 0; i < 30; i++) {
      const uci = randomLegalMove(fen, rng);
      expect(uci).toBeTruthy();
      const chess = new Chess(fen);
      expect(() => chess.move({ from: uci!.slice(0, 2), to: uci!.slice(2, 4) })).not.toThrow();
    }
  });

  it("restituisce null in una posizione terminale", () => {
    // Matto dell'imbecille: il Bianco è sotto matto e non ha mosse.
    const mate = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
    expect(randomLegalMove(mate, createRng(1))).toBeNull();
  });
});
