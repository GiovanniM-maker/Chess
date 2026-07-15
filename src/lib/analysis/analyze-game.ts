import { Chess } from "chess.js";
import type { AnalysisMoment, MomentAlternative, PieceColor } from "@/lib/types";
import type { ChessEngine } from "@/lib/engine";
import { classifyMoment } from "./classify";
import { selectMoments, type MoveEvaluation } from "./select";

/** Numero di varianti alternative richieste al motore per ogni posizione. */
const ALTERNATIVES_MULTIPV = 3;
/** Lunghezza massima (in semimosse) della linea mostrata per ogni variante. */
const ALTERNATIVE_LINE_PLIES = 6;

export interface AnalyzeGameParams {
  /** Mosse della partita in notazione SAN, in ordine. */
  sanMoves: string[];
  /** Colore del giocatore umano: si analizzano solo le sue mosse. */
  playerColor: PieceColor;
  engine: ChessEngine;
  /** Profondità di analisi (deterministica). */
  depth?: number;
  /** Callback di avanzamento: (completate, totali). */
  onProgress?: (done: number, total: number) => void;
}

function sanFromUci(fen: string, uci: string): string {
  const chess = new Chess(fen);
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci.slice(4, 5) : undefined;
  try {
    const move = chess.move({ from, to, promotion });
    return move.san;
  } catch {
    return uci;
  }
}

/** Converte una variante UCI del motore nelle prime mosse in SAN. */
function sanLine(fen: string, pvUci: string[]): string[] {
  const chess = new Chess(fen);
  const line: string[] = [];
  for (const uci of pvUci.slice(0, ALTERNATIVE_LINE_PLIES)) {
    try {
      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
      });
      line.push(move.san);
    } catch {
      break;
    }
  }
  return line;
}

/**
 * Analizza una partita e restituisce i (fino a 3) momenti educativi relativi
 * alle mosse del giocatore. Deterministica a parità di motore e profondità:
 * l'unica sorgente di valutazione è il motore, non il modello linguistico.
 */
export async function analyzeGame(params: AnalyzeGameParams): Promise<AnalysisMoment[]> {
  const { sanMoves, playerColor, engine, depth = 12, onProgress } = params;

  // Ricostruisce le posizioni prima/dopo ogni mossa del giocatore.
  const replay = new Chess();
  interface PlayerPly {
    ply: number;
    moveNumber: number;
    fenBefore: string;
    fenAfter: string;
    playedSan: string;
    playedUci: string;
  }
  const playerPlies: PlayerPly[] = [];

  sanMoves.forEach((san, index) => {
    const fenBefore = replay.fen();
    const colorMoved = replay.turn();
    let move;
    try {
      move = replay.move(san);
    } catch {
      return;
    }
    if (colorMoved === playerColor) {
      playerPlies.push({
        ply: index + 1,
        moveNumber: Math.floor(index / 2) + 1,
        fenBefore,
        fenAfter: replay.fen(),
        playedSan: san,
        playedUci: `${move.from}${move.to}${move.promotion ?? ""}`,
      });
    }
  });

  const total = playerPlies.length;
  const evaluations: MoveEvaluation[] = [];
  let done = 0;

  for (const item of playerPlies) {
    const before = await engine.evaluate(item.fenBefore, {
      depth,
      multipv: ALTERNATIVES_MULTIPV,
    });
    const bestUci = before.bestMoveUci;
    const scoreBeforeCp = before.lines[0]?.scoreCp ?? 0;
    const alternatives: MomentAlternative[] = before.lines
      .slice(0, ALTERNATIVES_MULTIPV)
      .map((line) => ({
        uci: line.moveUci,
        san: sanFromUci(item.fenBefore, line.moveUci),
        scoreCp: line.scoreCp,
        lineSan: sanLine(item.fenBefore, line.pv),
      }));

    const after = await engine.evaluate(item.fenAfter, { depth, multipv: 1 });
    const opponentBestUci = after.bestMoveUci;
    // Il punteggio dopo è dal punto di vista dell'avversario: si nega.
    const scoreAfterCp = -(after.lines[0]?.scoreCp ?? 0);

    done += 1;
    onProgress?.(done, total);

    if (!bestUci) continue;

    evaluations.push({
      ply: item.ply,
      moveNumber: item.moveNumber,
      colorMoved: playerColor,
      fenBefore: item.fenBefore,
      fenAfter: item.fenAfter,
      playedSan: item.playedSan,
      playedUci: item.playedUci,
      bestUci,
      bestSan: sanFromUci(item.fenBefore, bestUci),
      scoreBeforeCp,
      scoreAfterCp,
      centipawnLoss: Math.max(0, scoreBeforeCp - scoreAfterCp),
      opponentBestUci,
      alternatives,
    });
  }

  return selectMoments(evaluations).map((evaluation) => ({
    id: `ply-${evaluation.ply}`,
    ply: evaluation.ply,
    moveNumber: evaluation.moveNumber,
    colorMoved: evaluation.colorMoved,
    fenBefore: evaluation.fenBefore,
    fenAfter: evaluation.fenAfter,
    playedSan: evaluation.playedSan,
    playedUci: evaluation.playedUci,
    bestSan: evaluation.bestSan,
    bestUci: evaluation.bestUci,
    scoreBeforeCp: evaluation.scoreBeforeCp,
    scoreAfterCp: evaluation.scoreAfterCp,
    centipawnLoss: evaluation.centipawnLoss,
    alternatives: evaluation.alternatives,
    type: classifyMoment({
      moveNumber: evaluation.moveNumber,
      colorMoved: evaluation.colorMoved,
      fenBefore: evaluation.fenBefore,
      fenAfter: evaluation.fenAfter,
      playedUci: evaluation.playedUci,
      bestUci: evaluation.bestUci,
      scoreBeforeCp: evaluation.scoreBeforeCp,
      scoreAfterCp: evaluation.scoreAfterCp,
      centipawnLoss: evaluation.centipawnLoss,
      opponentBestUci: evaluation.opponentBestUci,
    }),
  }));
}
