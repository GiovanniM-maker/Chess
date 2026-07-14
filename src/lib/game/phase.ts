/**
 * Fasi esplicite del ciclo di vita di una partita. Nessuno stato implicito:
 * ogni schermata del flusso di gioco corrisponde a una di queste fasi.
 *
 * setup → playing → finished → analyzing → review → replay → (review | setup)
 */
export type GamePhase = "setup" | "playing" | "finished" | "analyzing" | "review" | "replay";
