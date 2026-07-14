"use client";

import type { PieceColor } from "@/lib/types";
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
        fen={fen}
        orientation={playerColor === "w" ? "white" : "black"}
        draggable={isPlayerTurn}
        lastMove={lastMove}
        onMove={onMove}
      />

      <MoveList moves={historySan} />

      <Button variant="outline" className="w-full" onClick={onResign}>
        Abbandona la partita
      </Button>
    </div>
  );
}
