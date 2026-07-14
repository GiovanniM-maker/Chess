# Pensa — Prototipo Tecnico (Fase 1)

Prototipo tecnico dell'app che insegna a **ragionare** negli scacchi. Il PRD
completo è in [`docs/PIANO_DI_SVILUPPO.md`](docs/PIANO_DI_SVILUPPO.md).

Questa Fase 1 valida **una sola ipotesi**: _un principiante trova utile giocare
una partita e ricevere una spiegazione educativa dei propri tre errori
principali, collegata alle proprie intenzioni._

Gira **interamente nel browser**: nessun account, nessun backend, nessuna API
esterna, nessuna AI generativa. Deployabile su **Vercel** senza configurazione.

## Comandi

```bash
npm install
npm run dev        # sviluppo su http://localhost:3000
npm run build      # build di produzione
npm run start      # serve la build
npm run lint       # ESLint (next/core-web-vitals)
npm run test       # Vitest + Testing Library
npm run typecheck  # tsc --noEmit (strict)
```

## Flusso utente

`Home → Setup → Playing → Finished → Analyzing → Review → Replay → Home`

1. **Home** — Nuova partita, Storico, Info. Nessun login.
2. **Setup** — scelta colore e livello bot (Principiante Assoluto / Principiante / Amatoriale).
3. **Playing** — scacchiera completa (regole ufficiali, arrocco, en passant,
   promozione, matto, stallo, patte), drag&drop + tap-to-move, cronologia,
   abbandono. Il bot è Stockfish in un Web Worker (UI mai bloccata).
4. **Finished** — esito e avvio analisi.
5. **Analyzing** — analisi deterministica con barra di avanzamento.
6. **Review** — i 3 errori più istruttivi; per ognuno l'app chiede
   l'intenzione, poi genera una spiegazione (deterministica, ≤120 parole, con
   una sola azione concreta).
7. **Replay** — rivivi la posizione: la tua mossa, la mossa migliore, oppure
   rigioca liberamente.

Le partite sono salvate in **IndexedDB** e riapribili dallo Storico.

## Architettura

```
src/
  app/                      # Next.js App Router (pagine)
    page.tsx                #   Home
    play/page.tsx           #   Flusso di gioco (state machine per fase)
    history/                #   Storico + dettaglio/review
    about/page.tsx          #   Info e licenze
  components/
    ui/                     # primitive in stile shadcn/ui (button, card, badge)
    board/BoardView.tsx     # scacchiera responsive (react-chessboard)
    game/                   # schermate e componenti del flusso
  lib/
    types.ts                # tipi di dominio condivisi
    chess/                  # regole, materiale, esito (chess.js)
    engine/                 # adapter Stockfish WASM (Web Worker, UCI) + parsing
    bot/                    # livelli, RNG deterministico, selezione mossa (pura)
    analysis/               # analisi partita, classificazione, spiegazioni
    storage/                # persistenza IndexedDB (idb)
    game/                   # state machine + hook controller di partita
    format.ts / utils.ts    # helper di presentazione
public/engine/              # stockfish.js + .wasm (serviti staticamente)
```

**Separazione chiave:** la logica _pura_ (selezione mossa bot, selezione e
classificazione dei momenti, spiegazioni, storage) è isolata dal motore
Stockfish (che gira solo nel browser). Questo rende tutta la logica testabile
in Node senza WebAssembly, iniettando un motore finto.

**Determinismo:** valutazioni e analisi provengono **solo dal motore**; le
spiegazioni sono generate da **template deterministici** a partire dai dati del
motore e dall'intenzione dichiarata. Nessun modello linguistico.

## Decisioni tecniche (e motivazioni)

- **Scacchiera: `react-chessboard` (MIT)** invece di Chessground (GPL-3.0). Il
  PRD (§32) impone un gate sulle licenze: si è scelta la libreria permissiva
  per ridurre l'entanglement copyleft sul frontend.
- **Motore: `stockfish.js@10` (build WASM single-thread)** eseguito come Web
  Worker classico da `/public/engine`. Non richiede header COOP/COEP né
  `SharedArrayBuffer`: è la soluzione più semplice e robusta e funziona su
  Vercel senza configurazione. Stockfish è GPL-3.0 (licenza in
  `public/engine/STOCKFISH-LICENSE.txt`).
- **Persistenza: IndexedDB via `idb`**, come da PRD per la Fase 1.
- **Livelli bot:** non solo profondità ridotta (darebbe bot "forti ma
  sabotati"), ma profondità + scelta probabilistica (softmax con temperatura)
  tra più mosse candidate MultiPV. Parametri semplici, da calibrare in seguito.
- **State machine esplicita:** ogni schermata corrisponde a una fase; nessuno
  stato implicito.

## Test

`npm run test` — 34 test su: regole (arrocco, en passant, promozione, matto,
stallo, materiale insufficiente), selezione mossa del bot (validità/legalità),
parsing UCI, selezione e classificazione dei momenti, spiegazioni (lunghezza e
personalizzazione), analisi completa con motore finto, persistenza e
caricamento della review.

## Limitazioni note

- L'esecuzione **in-browser** del Worker Stockfish non è automatizzabile in
  questo ambiente (assenza di driver browser); sono verificati il corretto
  serving degli asset (`.wasm` con MIME `application/wasm`), la struttura
  dell'integrazione UCI e tutta la logica pura tramite test.
- La **calibrazione** dei tre livelli bot è preliminare (parametri semplici),
  come previsto dal PRD: la taratura fine è una fase successiva.
- L'analisi valuta le posizioni con profondità fissa e può richiedere alcuni
  secondi su partite lunghe (mostrata con barra di avanzamento).
