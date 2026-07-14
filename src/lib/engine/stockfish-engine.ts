import type { ChessEngine, EngineEvaluation, EngineLine, EvaluateOptions } from "./types";
import { parseInfoLine } from "./parse";

const ENGINE_URL = "/engine/stockfish.js";

/**
 * Adapter del motore Stockfish (build WASM single-thread) eseguito in un Web
 * Worker classico. Comunica via protocollo UCI su `postMessage`.
 *
 * Vincoli:
 * - istanziabile solo nel browser (usa `Worker`);
 * - una sola valutazione per volta: le richieste vengono serializzate, così
 *   l'analisi (che chiama `evaluate` in sequenza) resta corretta.
 */
export class StockfishEngine implements ChessEngine {
  private worker: Worker;
  private readyPromise: Promise<void>;
  private queue: Promise<unknown> = Promise.resolve();

  constructor() {
    if (typeof window === "undefined") {
      throw new Error("StockfishEngine può essere creato solo nel browser.");
    }
    this.worker = new Worker(ENGINE_URL);
    this.readyPromise = this.handshake();
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  private send(command: string): void {
    this.worker.postMessage(command);
  }

  /** Attende una riga che soddisfa il predicato, con timeout di sicurezza. */
  private waitFor(predicate: (line: string) => boolean, timeoutMs = 20_000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.worker.removeEventListener("message", onMessage);
        reject(new Error("Timeout in attesa della risposta del motore."));
      }, timeoutMs);

      const onMessage = (event: MessageEvent) => {
        const line = typeof event.data === "string" ? event.data : "";
        if (predicate(line)) {
          clearTimeout(timer);
          this.worker.removeEventListener("message", onMessage);
          resolve();
        }
      };
      this.worker.addEventListener("message", onMessage);
    });
  }

  private async handshake(): Promise<void> {
    this.send("uci");
    await this.waitFor((line) => line === "uciok");
    this.send("isready");
    await this.waitFor((line) => line === "readyok");
  }

  evaluate(fen: string, opts: EvaluateOptions): Promise<EngineEvaluation> {
    // Serializza le richieste accodandole sulla catena `queue`.
    const run = this.queue.then(() => this.evaluateNow(fen, opts));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async evaluateNow(fen: string, opts: EvaluateOptions): Promise<EngineEvaluation> {
    await this.readyPromise;
    const multipv = Math.max(1, opts.multipv ?? 1);
    const linesByRank = new Map<number, EngineLine>();
    let reachedDepth = 0;

    const done = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.worker.removeEventListener("message", onMessage);
        reject(new Error("Timeout durante la valutazione della posizione."));
      }, 30_000);

      const onMessage = (event: MessageEvent) => {
        const line = typeof event.data === "string" ? event.data : "";
        if (line.startsWith("info ")) {
          const depthMatch = line.match(/ depth (\d+)/);
          if (depthMatch?.[1]) reachedDepth = Math.max(reachedDepth, Number(depthMatch[1]));
          const parsed = parseInfoLine(line);
          if (parsed) linesByRank.set(parsed.rank, parsed);
        } else if (line.startsWith("bestmove")) {
          clearTimeout(timer);
          this.worker.removeEventListener("message", onMessage);
          resolve();
        }
      };
      this.worker.addEventListener("message", onMessage);
    });

    this.send("ucinewgame");
    this.send(`setoption name MultiPV value ${multipv}`);
    this.send(`position fen ${fen}`);
    this.send(`go depth ${opts.depth}`);

    await done;

    const lines = Array.from(linesByRank.values()).sort((a, b) => a.rank - b.rank);
    return {
      bestMoveUci: lines[0]?.moveUci ?? null,
      lines,
      depth: reachedDepth,
    };
  }

  dispose(): void {
    try {
      this.send("quit");
    } catch {
      // ignora: il worker potrebbe essere già terminato
    }
    this.worker.terminate();
  }
}
