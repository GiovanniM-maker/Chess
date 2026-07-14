"use client";

import * as React from "react";
import { Chessboard } from "react-chessboard";

type ChessboardProps = React.ComponentProps<typeof Chessboard>;
type DropHandler = NonNullable<ChessboardProps["onPieceDrop"]>;
type PromotionHandler = NonNullable<ChessboardProps["onPromotionPieceSelect"]>;
type SquareClickHandler = NonNullable<ChessboardProps["onSquareClick"]>;

export interface BoardViewProps {
  fen: string;
  orientation: "white" | "black";
  draggable?: boolean;
  lastMove?: { from: string; to: string } | null;
  bestArrow?: { from: string; to: string } | null;
  /** Esegue una mossa: from/to (+ promozione già decisa). Ritorna true se legale. */
  onMove?: (from: string, to: string, promotion?: string) => boolean;
}

const HIGHLIGHT = "rgba(22, 163, 74, 0.35)";

/**
 * Scacchiera responsive. Misura il contenitore e adatta la larghezza, così
 * funziona su telefono, tablet e desktop. Supporta drag&drop e tap-to-move
 * (tocca il pezzo, poi la casa di destinazione).
 */
export function BoardView({
  fen,
  orientation,
  draggable = true,
  lastMove,
  bestArrow,
  onMove,
}: BoardViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(320);
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.min(Math.floor(entry.contentRect.width), 480));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const move = React.useCallback(
    (from: string, to: string, promotion?: string): boolean => {
      setSelected(null);
      return onMove ? onMove(from, to, promotion) : false;
    },
    [onMove],
  );

  const onDrop: DropHandler = (source, target) => move(source, target);

  const onPromotion: PromotionHandler = (piece, from, to) => {
    if (!from || !to || !piece) return false;
    return move(from, to, piece.charAt(1).toLowerCase());
  };

  const onSquareClick: SquareClickHandler = (square) => {
    if (!draggable) return;
    if (selected && selected !== square) {
      const applied = move(selected, square);
      if (!applied) setSelected(square);
      return;
    }
    setSelected((prev) => (prev === square ? null : square));
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { background: HIGHLIGHT };
    customSquareStyles[lastMove.to] = { background: HIGHLIGHT };
  }
  if (selected) {
    customSquareStyles[selected] = { background: "rgba(59, 130, 246, 0.4)" };
  }

  const customArrows: [string, string, string][] = bestArrow
    ? [[bestArrow.from, bestArrow.to, "#16a34a"]]
    : [];

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-[480px]">
      <Chessboard
        position={fen}
        boardOrientation={orientation}
        boardWidth={width}
        arePiecesDraggable={draggable}
        onPieceDrop={onDrop}
        onPromotionPieceSelect={onPromotion}
        onSquareClick={onSquareClick}
        customSquareStyles={customSquareStyles}
        customArrows={customArrows as never}
        customBoardStyle={{ borderRadius: "0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        customDarkSquareStyle={{ backgroundColor: "#4b7399" }}
        customLightSquareStyle={{ backgroundColor: "#e8edf2" }}
      />
    </div>
  );
}
