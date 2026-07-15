import { describe, expect, it } from "vitest";
import type { AnalysisMoment, MomentType, PieceColor, SavedGame, StoredMove } from "@/lib/types";
import { allTitles, buildHabits, earnedTitles } from "./titles";
import { gradeLadder } from "./profile";

let seq = 0;

function moment(type: MomentType, colorMoved: PieceColor = "w"): AnalysisMoment {
  seq += 1;
  return {
    id: `m${seq}`,
    ply: 5,
    moveNumber: 3,
    colorMoved,
    fenBefore: "fb",
    fenAfter: "fa",
    playedSan: "a3",
    playedUci: "a2a3",
    bestSan: "e4",
    bestUci: "e2e4",
    scoreBeforeCp: 0,
    scoreAfterCp: 0,
    centipawnLoss: 200,
    type,
  };
}

/** Costruisce una partita (Bianco al giocatore) con controllo su analisi e mosse. */
function makeGame(opts: {
  createdAt: number;
  moments?: MomentType[] | null;
  castleAtPly?: number | null;
  plies?: number;
}): SavedGame {
  const { createdAt, moments = [], castleAtPly = null, plies = 30 } = opts;
  const moves: StoredMove[] = Array.from({ length: plies }, (_, index) => {
    const ply = index + 1;
    const san = ply === castleAtPly ? "O-O" : "a3";
    return { ply, san, fenAfter: "f" };
  });
  return {
    id: `g${createdAt}`,
    createdAt,
    playerColor: "w",
    result: { winner: "white", reason: "checkmate" },
    pgn: "",
    finalFen: "",
    moves,
    analysis:
      moments === null
        ? undefined
        : { generatedAt: 0, moments: moments.map((type) => moment(type)) },
  };
}

function habit(games: SavedGame[], id: string) {
  return buildHabits(games).find((entry) => entry.id === id)!;
}

describe("streak comportamentali (niente pezzi in presa)", () => {
  it("conta le partite analizzate consecutive senza pezzo perso", () => {
    const games = [
      makeGame({ createdAt: 1, moments: [] }),
      makeGame({ createdAt: 2, moments: [] }),
      makeGame({ createdAt: 3, moments: ["tattica-mancata"] }), // niente pezzo-perso: ok
    ];
    const h = habit(games, "no-hang");
    expect(h.current).toBe(3);
    expect(h.best).toBe(3);
    expect(h.applicableGames).toBe(3);
  });

  it("un pezzo perso azzera la streak attuale ma non il record", () => {
    const games = [
      makeGame({ createdAt: 1, moments: [] }),
      makeGame({ createdAt: 2, moments: [] }),
      makeGame({ createdAt: 3, moments: [] }),
      makeGame({ createdAt: 4, moments: ["pezzo-perso"] }), // rompe la serie
      makeGame({ createdAt: 5, moments: [] }),
    ];
    const h = habit(games, "no-hang");
    expect(h.current).toBe(1);
    expect(h.best).toBe(3);
  });

  it("le partite non analizzate sono saltate, non spezzano la serie", () => {
    const games = [
      makeGame({ createdAt: 1, moments: [] }),
      makeGame({ createdAt: 2, moments: null }), // non valutabile
      makeGame({ createdAt: 3, moments: [] }),
    ];
    const h = habit(games, "no-hang");
    expect(h.current).toBe(2);
    expect(h.applicableGames).toBe(2);
  });

  it("un pezzo perso del BOT non conta contro il giocatore", () => {
    const games = [makeGame({ createdAt: 1, moments: [] })];
    // Inietta un momento del Nero (avversario) nella partita analizzata.
    games[0]!.analysis!.moments.push(moment("pezzo-perso", "b"));
    expect(habit(games, "no-hang").current).toBe(1);
  });
});

describe("streak dell'arrocco (verificabile senza analisi)", () => {
  it("conta gli arrocchi entro la decima, ignora le partite troppo corte", () => {
    const games = [
      makeGame({ createdAt: 1, moments: null, castleAtPly: 9, plies: 30 }),
      makeGame({ createdAt: 2, moments: null, castleAtPly: null, plies: 6 }), // corta: "na"
      makeGame({ createdAt: 3, moments: null, castleAtPly: 7, plies: 30 }),
    ];
    const h = habit(games, "castle-early");
    expect(h.current).toBe(2); // la partita corta è saltata
    expect(h.applicableGames).toBe(2);
  });

  it("non arroccare in una partita lunga rompe la serie", () => {
    const games = [
      makeGame({ createdAt: 1, moments: null, castleAtPly: 9 }),
      makeGame({ createdAt: 2, moments: null, castleAtPly: null, plies: 40 }),
    ];
    expect(habit(games, "castle-early").current).toBe(0);
  });
});

describe("titoli verificati", () => {
  it("si conquistano al raggiungimento della soglia e restano acquisiti", () => {
    const games = Array.from({ length: 3 }, (_, index) =>
      makeGame({ createdAt: index + 1, moments: [] }),
    );
    // 3 partite pulite → titolo "Presa sicura" (soglia 3), non ancora "Muraglia" (6).
    const earned = earnedTitles(games);
    expect(earned.map((title) => title.id)).toContain("presa-sicura");
    expect(earned.map((title) => title.id)).not.toContain("muraglia");

    // Dopo un pezzo perso la streak si azzera, ma il titolo resta.
    const withBreak = [...games, makeGame({ createdAt: 4, moments: ["pezzo-perso"] })];
    expect(earnedTitles(withBreak).map((title) => title.id)).toContain("presa-sicura");
    expect(habit(withBreak, "no-hang").current).toBe(0);
  });

  it("indica il prossimo titolo e quanto manca", () => {
    const games = Array.from({ length: 2 }, (_, index) =>
      makeGame({ createdAt: index + 1, moments: [] }),
    );
    const next = habit(games, "no-hang").nextTitle;
    expect(next?.title.id).toBe("presa-sicura");
    expect(next?.remaining).toBe(1); // 2 di fila, ne serve 1 in più
  });

  it("senza partite non c'è alcun titolo, ma il catalogo completo esiste", () => {
    expect(earnedTitles([])).toEqual([]);
    expect(allTitles().length).toBe(8); // 4 abitudini × 2 livelli
  });
});

describe("scala dei gradi completa", () => {
  it("va da Esordiente a Re, in ordine crescente", () => {
    const ladder = gradeLadder();
    expect(ladder[0]!.grade.id).toBe("esordiente");
    expect(ladder[ladder.length - 1]!.grade.id).toBe("re");
    const levels = ladder.map((rung) => rung.minLevel);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });
});
