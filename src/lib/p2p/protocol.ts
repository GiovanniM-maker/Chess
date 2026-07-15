import { Chess } from "chess.js";
import type { PieceColor } from "@/lib/types";

/**
 * Messaggi scambiati tra i due giocatori di una partita via link.
 * - `init`: l'host assegna il colore all'ospite all'inizio.
 * - `sync`: l'host ri-invia colore e partita (PGN) a un ospite riconnesso.
 * - `move`: una mossa, con il ply atteso per scartare duplicati/fuori ordine.
 * - `resign`: abbandono.
 */
export type FriendMessage =
  | { type: "init"; yourColor: PieceColor }
  | { type: "sync"; yourColor: PieceColor; pgn: string }
  | { type: "move"; san: string; ply: number }
  | { type: "resign" };

/** Valida un dato ricevuto dalla rete: mai fidarsi della forma del payload. */
export function parseFriendMessage(raw: unknown): FriendMessage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const msg = raw as Record<string, unknown>;
  if (msg.type === "init" && (msg.yourColor === "w" || msg.yourColor === "b")) {
    return { type: "init", yourColor: msg.yourColor };
  }
  if (
    msg.type === "sync" &&
    (msg.yourColor === "w" || msg.yourColor === "b") &&
    typeof msg.pgn === "string"
  ) {
    return { type: "sync", yourColor: msg.yourColor, pgn: msg.pgn };
  }
  if (msg.type === "move" && typeof msg.san === "string" && typeof msg.ply === "number") {
    return { type: "move", san: msg.san, ply: msg.ply };
  }
  if (msg.type === "resign") {
    return { type: "resign" };
  }
  return null;
}

export interface ApplyMoveResult {
  ok: boolean;
  from?: string;
  to?: string;
}

/**
 * Applica una mossa remota SOLO se coerente con lo stato locale: ply atteso
 * (scarta duplicati e mosse fuori ordine), turno dell'avversario, legalità
 * verificata da chess.js. Muta l'istanza `chess` passata.
 */
export function tryApplyRemoteMove(
  chess: Chess,
  msg: { san: string; ply: number },
  opponentColor: PieceColor,
): ApplyMoveResult {
  if (msg.ply !== chess.history().length + 1) return { ok: false };
  if (chess.turn() !== opponentColor) return { ok: false };
  try {
    const move = chess.move(msg.san);
    return { ok: true, from: move.from, to: move.to };
  } catch {
    return { ok: false };
  }
}
