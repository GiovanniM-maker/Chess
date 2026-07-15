"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MoveListProps {
  moves: string[];
  /** Semimossa evidenziata (1-based). Se assente, nessuna evidenziazione. */
  activePly?: number;
  /** Se presente, le mosse diventano cliccabili per rivedere la posizione. */
  onSelectPly?: (ply: number) => void;
}

interface MoveRow {
  number: number;
  whitePly: number;
  white: string;
  blackPly: number | null;
  black: string | null;
}

/**
 * Cronologia delle mosse a coppie bianco/nero. Cliccando una mossa si può
 * rivedere la posizione corrispondente (navigazione, senza modificare la
 * partita). La lista scorre da sola sull'ultima mossa evidenziata.
 */
export function MoveList({ moves, activePly, onSelectPly }: MoveListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !activePly) return;
    const element = container.querySelector<HTMLElement>(`[data-ply="${activePly}"]`);
    element?.scrollIntoView({ block: "nearest" });
  }, [activePly, moves.length]);

  if (moves.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessuna mossa giocata.</p>;
  }

  const rows: MoveRow[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      number: i / 2 + 1,
      whitePly: i + 1,
      white: moves[i] ?? "",
      blackPly: moves[i + 1] ? i + 2 : null,
      black: moves[i + 1] ?? null,
    });
  }

  const renderMove = (san: string, ply: number) => {
    const isActive = activePly === ply;
    const className = cn(
      "rounded px-1.5 py-0.5 text-left font-medium",
      isActive && "bg-primary/20 text-primary",
      onSelectPly && "cursor-pointer hover:bg-accent",
    );
    if (!onSelectPly) {
      return (
        <span data-ply={ply} className={className}>
          {san}
        </span>
      );
    }
    return (
      <button
        type="button"
        data-ply={ply}
        aria-label={`Vai alla mossa ${san}`}
        aria-current={isActive ? "step" : undefined}
        onClick={() => onSelectPly(ply)}
        className={className}
      >
        {san}
      </button>
    );
  };

  return (
    <div
      ref={containerRef}
      className="max-h-40 overflow-y-auto rounded-lg border bg-muted/40 p-2 text-sm"
    >
      <ol className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-0.5 tabular-nums">
        {rows.map((row) => (
          <li key={row.number} className="contents">
            <span className="text-muted-foreground">{row.number}.</span>
            {renderMove(row.white, row.whitePly)}
            {row.black && row.blackPly ? renderMove(row.black, row.blackPly) : <span />}
          </li>
        ))}
      </ol>
    </div>
  );
}
