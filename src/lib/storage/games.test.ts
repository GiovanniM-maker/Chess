import { beforeEach, describe, expect, it } from "vitest";
import type { SavedGame } from "@/lib/types";
import {
  _clearAllGamesForTests,
  createGameId,
  deleteGame,
  getGame,
  listGames,
  saveGame,
  updateGameAnalysis,
  updateGameIntention,
} from "./games";

function makeGame(overrides: Partial<SavedGame> = {}): SavedGame {
  return {
    id: createGameId(),
    createdAt: Date.now(),
    playerColor: "w",
    botLevel: "beginner",
    result: { winner: "white", reason: "checkmate" },
    pgn: "1. e4 e5",
    finalFen: "startpos",
    moves: [
      { ply: 1, san: "e4", fenAfter: "fen1" },
      { ply: 2, san: "e5", fenAfter: "fen2" },
    ],
    ...overrides,
  };
}

describe("persistenza delle partite (IndexedDB)", () => {
  beforeEach(async () => {
    await _clearAllGamesForTests();
  });

  it("salva e recupera una partita", async () => {
    const game = makeGame();
    await saveGame(game);
    const loaded = await getGame(game.id);
    expect(loaded).toEqual(game);
  });

  it("elenca le partite dalla più recente alla più vecchia", async () => {
    const older = makeGame({ createdAt: 1000 });
    const newer = makeGame({ createdAt: 2000 });
    await saveGame(older);
    await saveGame(newer);
    const list = await listGames();
    expect(list.map((g) => g.id)).toEqual([newer.id, older.id]);
  });

  it("elimina una partita", async () => {
    const game = makeGame();
    await saveGame(game);
    await deleteGame(game.id);
    expect(await getGame(game.id)).toBeUndefined();
  });

  it("carica la review salvata (analisi + intenzioni)", async () => {
    const game = makeGame({
      analysis: {
        generatedAt: Date.now(),
        moments: [
          {
            id: "ply-3",
            ply: 3,
            moveNumber: 2,
            colorMoved: "w",
            fenBefore: "fb",
            fenAfter: "fa",
            playedSan: "Qh5",
            playedUci: "d1h5",
            bestSan: "Nf3",
            bestUci: "g1f3",
            scoreBeforeCp: 20,
            scoreAfterCp: -120,
            centipawnLoss: 140,
            type: "problema-sviluppo",
          },
        ],
      },
    });
    await saveGame(game);
    await updateGameIntention(game.id, "ply-3", "attaccare");

    const loaded = await getGame(game.id);
    expect(loaded?.analysis?.moments).toHaveLength(1);
    expect(loaded?.analysis?.moments[0]?.type).toBe("problema-sviluppo");
    expect(loaded?.intentions).toEqual({ "ply-3": "attaccare" });
  });

  it("aggiorna l'analisi di una partita esistente", async () => {
    const game = makeGame();
    await saveGame(game);
    await updateGameAnalysis(game.id, { generatedAt: 123, moments: [] });
    const loaded = await getGame(game.id);
    expect(loaded?.analysis?.generatedAt).toBe(123);
  });
});
