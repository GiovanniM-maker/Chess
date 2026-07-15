import { describe, expect, it } from "vitest";
import type { AnalysisMoment, SavedGame } from "@/lib/types";
import {
  BOX_INTERVAL_DAYS,
  DAILY_SET_SIZE,
  DAY_MS,
  MAX_BOX,
  MAX_ITEMS,
  dueItems,
  harvestReviewItems,
  nextDueAt,
  pruneItems,
  reviewResult,
  todaySet,
  type ReviewItem,
} from "./items";

const NOW = 1_000_000;

function moment(overrides: Partial<AnalysisMoment> = {}): AnalysisMoment {
  return {
    id: "ply-9",
    ply: 9,
    moveNumber: 5,
    colorMoved: "w",
    fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    fenAfter: "after",
    playedSan: "a3",
    playedUci: "a2a3",
    bestSan: "e4",
    bestUci: "e2e4",
    scoreBeforeCp: 100,
    scoreAfterCp: -100,
    centipawnLoss: 200,
    type: "problema-sviluppo",
    ...overrides,
  };
}

function game(overrides: Partial<SavedGame> = {}): SavedGame {
  return {
    id: "g1",
    createdAt: 1,
    playerColor: "w",
    result: { winner: "white", reason: "checkmate" },
    pgn: "",
    finalFen: "",
    moves: [],
    analysis: { generatedAt: 0, moments: [moment()] },
    ...overrides,
  };
}

function item(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    id: "g1:ply-9",
    gameId: "g1",
    momentId: "ply-9",
    createdAt: NOW,
    fen: "fen",
    playerColor: "w",
    solutions: ["e4"],
    bestSan: "e4",
    bestUci: "e2e4",
    playedSan: "a3",
    type: "problema-sviluppo",
    box: 0,
    dueAt: NOW,
    reviews: 0,
    successes: 0,
    ...overrides,
  };
}

describe("raccolta degli esercizi dalle partite analizzate", () => {
  it("crea un esercizio per ogni errore del giocatore, senza duplicati", () => {
    const fresh = harvestReviewItems([game()], [], NOW);
    expect(fresh).toHaveLength(1);
    expect(fresh[0]!.id).toBe("g1:ply-9");
    expect(fresh[0]!.fen).toBe(moment().fenBefore);
    expect(fresh[0]!.dueAt).toBe(NOW);

    // Una seconda raccolta con la coda già popolata non produce nulla.
    expect(harvestReviewItems([game()], fresh, NOW)).toHaveLength(0);
  });

  it("ignora le partite senza analisi e le mosse del bot", () => {
    expect(harvestReviewItems([game({ analysis: undefined })], [], NOW)).toHaveLength(0);
    const botMoment = moment({ colorMoved: "b" });
    const withBotMoment = game({ analysis: { generatedAt: 0, moments: [botMoment] } });
    expect(harvestReviewItems([withBotMoment], [], NOW)).toHaveLength(0);
  });

  it("accetta come soluzioni anche le alternative quasi pari alla migliore", () => {
    const withAlternatives = game({
      analysis: {
        generatedAt: 0,
        moments: [
          moment({
            alternatives: [
              { san: "e4", uci: "e2e4", scoreCp: 100, lineSan: [] },
              { san: "d4", uci: "d2d4", scoreCp: 70, lineSan: [] },
              { san: "a4", uci: "a2a4", scoreCp: -50, lineSan: [] },
            ],
          }),
        ],
      },
    });
    const [fresh] = harvestReviewItems([withAlternatives], [], NOW);
    expect(fresh!.solutions).toEqual(["e4", "d4"]); // a4 perde 150 cp: fuori
  });
});

describe("programmazione del ripasso (scatole di Leitner)", () => {
  it("un successo avanza di scatola e allunga l'attesa", () => {
    let current = item();
    for (let index = 0; index < BOX_INTERVAL_DAYS.length; index += 1) {
      current = reviewResult(current, true, NOW);
      expect(current.box).toBe(Math.min(index + 1, MAX_BOX));
      expect(current.dueAt).toBe(NOW + BOX_INTERVAL_DAYS[current.box - 1]! * DAY_MS);
    }
    // Oltre l'ultima scatola non si sale più.
    const beyond = reviewResult(current, true, NOW);
    expect(beyond.box).toBe(MAX_BOX);
    expect(beyond.successes).toBe(BOX_INTERVAL_DAYS.length + 1);
  });

  it("un errore riporta alla scatola 0 e ripropone domani", () => {
    const advanced = { ...item(), box: 4, successes: 4 };
    const failed = reviewResult(advanced, false, NOW);
    expect(failed.box).toBe(0);
    expect(failed.dueAt).toBe(NOW + DAY_MS);
    expect(failed.successes).toBe(4); // i successi passati non si cancellano
    expect(failed.reviews).toBe(1);
  });
});

describe("il riscaldamento di oggi", () => {
  it("prende solo gli esercizi scaduti, i più urgenti prima, al massimo 5", () => {
    const items = Array.from({ length: 8 }, (_, index) =>
      item({ id: `i${index}`, dueAt: NOW - index, createdAt: index }),
    );
    const notDue = item({ id: "future", dueAt: NOW + DAY_MS });
    const today = todaySet([...items, notDue], NOW);
    expect(today).toHaveLength(DAILY_SET_SIZE);
    expect(today[0]!.id).toBe("i7"); // in attesa da più tempo
    expect(today.some((entry) => entry.id === "future")).toBe(false);
    expect(dueItems([...items, notDue], NOW)).toHaveLength(8);
  });

  it("indica la prossima scadenza futura quando non c'è nulla da ripassare", () => {
    const later = item({ id: "a", dueAt: NOW + 3 * DAY_MS });
    const sooner = item({ id: "b", dueAt: NOW + DAY_MS });
    expect(nextDueAt([later, sooner], NOW)).toBe(NOW + DAY_MS);
    expect(nextDueAt([item({ dueAt: NOW - 1 })], NOW)).toBeNull();
  });

  it("la coda resta entro il tetto scartando i più vecchi", () => {
    const items = Array.from({ length: MAX_ITEMS + 10 }, (_, index) =>
      item({ id: `i${index}`, createdAt: index }),
    );
    const { keep, dropIds } = pruneItems(items);
    expect(keep).toHaveLength(MAX_ITEMS);
    expect(dropIds).toHaveLength(10);
    expect(dropIds).toContain("i0"); // il più vecchio viene scartato
    expect(keep.some((entry) => entry.id === `i${MAX_ITEMS + 9}`)).toBe(true);
  });
});
