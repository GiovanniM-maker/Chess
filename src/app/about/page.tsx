import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">Informazioni sul progetto</h1>
        <p className="text-muted-foreground">
          Questo è un <strong>prototipo tecnico</strong>. Serve a verificare una sola idea: che a un
          principiante sia utile giocare una partita e ricevere una spiegazione educativa dei propri
          tre errori principali, collegata a ciò che voleva fare.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Come funziona</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Giochi una partita contro un bot (tre livelli).</li>
          <li>La partita viene salvata sul tuo dispositivo.</li>
          <li>L&apos;analisi individua i tuoi tre errori più istruttivi.</li>
          <li>Per ogni errore ti chiediamo cosa volevi ottenere.</li>
          <li>Ricevi una spiegazione breve e una posizione da rigiocare.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Privacy e tecnologia</h2>
        <p className="text-sm text-muted-foreground">
          Tutto avviene <strong>interamente nel tuo browser</strong>: nessun account, nessun server,
          nessun dato inviato online. Le partite sono salvate localmente (IndexedDB). Il motore
          scacchistico è Stockfish, eseguito in WebAssembly in un Web Worker; l&apos;analisi e le
          valutazioni sono calcolate dal motore, non da un&apos;intelligenza artificiale generativa.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Licenze</h2>
        <p className="text-sm text-muted-foreground">
          Stockfish è distribuito con licenza GPL v3 (vedi{" "}
          <code className="rounded bg-muted px-1">/engine/STOCKFISH-LICENSE.txt</code>). La
          scacchiera usa <code className="rounded bg-muted px-1">react-chessboard</code> (MIT) e le
          regole <code className="rounded bg-muted px-1">chess.js</code> (BSD-2-Clause).
        </p>
      </section>

      <Link href="/play" className={buttonVariants({})}>
        Inizia a giocare
      </Link>
    </div>
  );
}
