"use client";

import * as React from "react";
import { Chessboard } from "react-chessboard";
import { Chess, legalTargets } from "@/lib/chess";

type ChessboardProps = React.ComponentProps<typeof Chessboard>;
type DropHandler = NonNullable<ChessboardProps["onPieceDrop"]>;
type PromotionHandler = NonNullable<ChessboardProps["onPromotionPieceSelect"]>;
type SquareClickHandler = NonNullable<ChessboardProps["onSquareClick"]>;
type DragBeginHandler = NonNullable<ChessboardProps["onPieceDragBegin"]>;
type DraggablePieceCheck = NonNullable<ChessboardProps["isDraggablePiece"]>;

export interface BoardViewProps {
  fen: string;
  orientation: "white" | "black";
  draggable?: boolean;
  lastMove?: { from: string; to: string } | null;
  bestArrow?: { from: string; to: string } | null;
  /** Esegue una mossa: from/to (+ promozione già decisa). Ritorna true se legale. */
  onMove?: (from: string, to: string, promotion?: string) => boolean;
}

// Colori UX (stile chess.com):
// - ultima mossa: azzurrino su casa di partenza e di arrivo (per capire da dove
//   viene il pezzo appena mosso, tuo o del bot);
// - selezione: giallo;
// - destinazioni legali: pallino su casa vuota, anello su cattura.
const LAST_MOVE_FROM = "rgba(125, 211, 252, 0.5)";
const LAST_MOVE_TO = "rgba(125, 211, 252, 0.7)";
const SELECTED_BG = "rgba(255, 213, 79, 0.6)";
const TARGET_DOT = "radial-gradient(circle, rgba(15, 41, 66, 0.25) 26%, transparent 27%)";
const TARGET_RING = "radial-gradient(circle, transparent 56%, rgba(15, 41, 66, 0.25) 57%)";

/**
 * Scacchiera responsive con interazione stile chess.com: selezioni un tuo
 * pezzo (tap o inizio drag) e vedi le destinazioni legali; tocchi una
 * destinazione per muovere, un altro tuo pezzo per cambiare selezione,
 * altrove per deselezionare. L'ultima mossa resta evidenziata in azzurro.
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

  const chess = React.useMemo(() => new Chess(fen), [fen]);
  const targets = React.useMemo(
    () => (selected ? legalTargets(fen, selected) : []),
    [fen, selected],
  );

  // La posizione è cambiata (es. risposta del bot): la selezione non è più valida.
  React.useEffect(() => {
    setSelected(null);
  }, [fen]);

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

  const isOwnPiece = React.useCallback(
    (square: string): boolean => {
      const piece = chess.get(square as never);
      return Boolean(piece && piece.color === chess.turn());
    },
    [chess],
  );

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

  // Mostra i pallini anche quando si inizia a trascinare un pezzo.
  const onDragBegin: DragBeginHandler = (_piece, square) => {
    if (draggable && isOwnPiece(square)) setSelected(square);
  };

  // Si possono trascinare solo i pezzi del lato al tratto.
  const canDragPiece: DraggablePieceCheck = ({ piece }) =>
    draggable && piece.startsWith(chess.turn());

  const onSquareClick: SquareClickHandler = (square) => {
    if (!draggable) return;
    if (selected) {
      if (square === selected) {
        setSelected(null);
        return;
      }
      if (targets.some((target) => target.to === square)) {
        move(selected, square);
        return;
      }
      // Un altro proprio pezzo: cambia selezione; altrimenti deseleziona.
      setSelected(isOwnPiece(square) ? square : null);
      return;
    }
    if (isOwnPiece(square)) setSelected(square);
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { background: LAST_MOVE_FROM };
    customSquareStyles[lastMove.to] = { background: LAST_MOVE_TO };
  }
  if (selected) {
    customSquareStyles[selected] = { background: SELECTED_BG };
  }
  for (const target of targets) {
    customSquareStyles[target.to] = {
      ...customSquareStyles[target.to],
      backgroundImage: target.isCapture ? TARGET_RING : TARGET_DOT,
    };
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
        isDraggablePiece={canDragPiece}
        onPieceDragBegin={onDragBegin}
        onPieceDrop={onDrop}
        onPromotionPieceSelect={onPromotion}
        onSquareClick={onSquareClick}
        animationDuration={200}
        customSquareStyles={customSquareStyles}
        customArrows={customArrows as never}
        customBoardStyle={{ borderRadius: "0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        customDarkSquareStyle={{ backgroundColor: "#4b7399" }}
        customLightSquareStyle={{ backgroundColor: "#e8edf2" }}
      />
    </div>
  );
}
