"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { PieceColor } from "@/lib/types";
import { positionAtPly } from "@/lib/chess";
import { Button } from "@/components/ui/button";
import { BoardView } from "@/components/board/BoardView";
import { MoveList } from "./MoveList";

export interface PlayingScreenProps {
  fen: string;
  playerColor: PieceColor;
  lastMove: { from: string; to: string } | null;
  isPlayerTurn: boolean;
  isBotThinking: boolean;
  historySan: string[];
  botLevelLabel: string;
  onMove: (from: string, to: string, promotion?: string) => boolean;
  onResign: () => void;
}

export function PlayingScreen({
  fen,
  playerColor,
  lastMove,
  isPlayerTurn,
  isBotThinking,
  historySan,
  botLevelLabel,
  onMove,
  onResign,
}: PlayingScreenProps) {
  const totalPlies = historySan.length;

  // Navigazione cronologia: null = posizione attuale (live), altrimenti il
  // numero di semimosse mostrate. In visualizzazione la scacchiera è bloccata:
  // si guarda il passato senza modificare la partita.
  const [viewPly, setViewPly] = React.useState<number | null>(null);
  const isViewing = viewPly !== null;

  const viewed = React.useMemo(
    () => (isViewing ? positionAtPly(historySan, viewPly ?? 0) : null),
    [isViewing, historySan, viewPly],
  );

  const goToPly = React.useCallback(
    (ply: number) => {
      // Arrivare all'ultima mossa equivale a tornare al vivo.
      setViewPly(ply >= totalPlies ? null : Math.max(0, ply));
    },
    [totalPlies],
  );

  const backOne = () => goToPly((viewPly ?? totalPlies) - 1);
  const forwardOne = () => {
    if (viewPly !== null) goToPly(viewPly + 1);
  };
  const backToLive = () => setViewPly(null);

  const atStart = totalPlies === 0 || viewPly === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Avversario: <span className="font-medium text-foreground">{botLevelLabel}</span>
        </span>
        <span aria-live="polite" className="font-medium">
          {isBotThinking ? "Il bot sta pensando…" : isPlayerTurn ? "Tocca a te" : "Attendi…"}
        </span>
      </div>

      <BoardView
        fen={viewed?.fen ?? fen}
        orientation={playerColor === "w" ? "white" : "black"}
        draggable={!isViewing && isPlayerTurn}
        lastMove={isViewing ? (viewed?.lastMove ?? null) : lastMove}
        onMove={onMove}
      />

      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Posizione iniziale"
          disabled={atStart}
          onClick={() => goToPly(0)}
        >
          <ChevronsLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mossa precedente"
          disabled={atStart}
          onClick={backOne}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="min-w-28 text-center text-xs tabular-nums text-muted-foreground">
          {isViewing ? `Posizione ${viewPly}/${totalPlies}` : "Posizione attuale"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mossa successiva"
          disabled={!isViewing}
          onClick={forwardOne}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Torna alla posizione attuale"
          disabled={!isViewing}
          onClick={backToLive}
        >
          <ChevronsRight className="h-5 w-5" />
        </Button>
      </div>

      {isViewing && (
        <p className="rounded-lg bg-secondary p-2 text-center text-xs text-secondary-foreground">
          Stai rivedendo una posizione passata: la scacchiera è in sola lettura.{" "}
          <button
            type="button"
            onClick={backToLive}
            className="font-semibold text-primary underline"
          >
            Torna alla partita
          </button>
        </p>
      )}

      <MoveList
        moves={historySan}
        activePly={isViewing ? (viewPly ?? 0) : totalPlies}
        onSelectPly={goToPly}
      />

      <Button variant="outline" className="w-full" onClick={onResign}>
        Abbandona la partita
      </Button>
    </div>
  );
}
