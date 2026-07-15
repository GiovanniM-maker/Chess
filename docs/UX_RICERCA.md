# Ricerca UX — cosa serve per giocare a scacchi e cosa insegnano le altre app

> Ricerca condotta a supporto del prototipo (Fase 1). Fonti: forum chess.com,
> recensioni e comparative di app (Dr. Wolf, Lichess, ChessKid, chess.com).
> Aggiornata: 2026-07. Le decisioni già implementate sono marcate ✅.

## 1. Cosa criticano i giocatori (da evitare)

### 1.1 Bot irrealistici — la critica più frequente e più utile per noi
I bot di chess.com sono descritti dagli utenti come **"motori a piena forza con
un tasso di errore casuale"**: giocano in modo tatticamente perfetto per decine
di mosse e poi **regalano la donna o un matto in 1 in modo assurdo**. La sintesi
di un utente: *"gli umani non giocano perfetti e poi fanno un blunder folle —
giocano male E fanno blunder"*. Altri esempi citati: bot che ignorano un pezzo
in presa attaccabile in tre modi ma parano sempre il matto in 1; blunder
"disumani" come mosse di re a caso; persino i bot >2000 regalano pezzi.

**Lezione applicata ✅:** i nostri livelli bassi sono *costantemente deboli*,
non forti-con-regali: profondità di ricerca bassissima (non "vedono" le
tattiche, come un principiante vero) + scelta probabilistica tra più mosse
candidate + quota di mosse legali casuali ai livelli 0–5. Nessun "gioco
perfetto interrotto da un regalo".

### 1.2 Paywall percepito come "ostaggio dei progressi"
Dr. Wolf è amato per il coaching ma criticato duramente per il modello: *"ti dà
un assaggio, poi tutto ciò che è utile richiede l'abbonamento"* — recensioni che
parlano di "bait and switch" e di progressi "tenuti in ostaggio". Lichess è il
preferito dei recensori proprio perché tutto è gratuito e senza pubblicità.

**Lezione:** il valore educativo core (review, spiegazioni) deve restare
accessibile; l'eventuale monetizzazione futura non deve bloccare il loop di
apprendimento. (Coerente con il PRD.)

### 1.3 Interfacce che sopraffanno i principianti
chess.com viene percepito come complesso dai neofiti (troppe feature, metriche,
modalità). Dr. Wolf vince proprio per l'interfaccia semplice, "da libro".

**Lezione ✅:** una schermata = una decisione (la nostra state machine);
linguaggio semplice; poche feature ma finite.

## 2. Cosa amano i giocatori (da adottare)

| Cosa | Dove | Stato da noi |
|---|---|---|
| Coach che spiega *perché* una mossa è sbagliata e qual era l'alternativa | Dr. Wolf | ✅ review con 3 errori + intenzione + spiegazione |
| Feedback gentile, mai punitivo | Dr. Wolf | ✅ tono delle spiegazioni template |
| Progressione graduale della difficoltà | Really Bad Chess, ChessKid | ✅ livelli 0–10 |
| Tutto gratis, niente ads | Lichess | ✅ prototipo interamente client-side |
| Allenamento a riconoscere le minacce | ChessKid | Futuro: lezione CCM (MVP Core) |

## 3. Checklist "cosa serve per giocare" (HUD standard)

Elementi che i giocatori danno per scontati in qualunque app seria:

- ✅ Evidenziazione ultima mossa (casa di partenza + arrivo)
- ✅ Pallini sulle mosse legali del pezzo selezionato (anello sulle catture)
- ✅ **Pezzi catturati + bilancio materiale (+n) accanto a ciascun giocatore**
- ✅ Cronologia mosse navigabile senza alterare la partita
- ✅ Selezione livello avversario chiara e percepibile (0–10 con descrizione)
- ✅ Abbandono; promozione; tap-to-move e drag&drop
- ⏳ Undo/ripeti mossa contro il bot (molto richiesto dai principianti)
- ⏳ Hint ("suggeriscimi una mossa") nelle partite di allenamento
- ⏳ Suoni opzionali (mossa/cattura/scacco)
- ⏳ Rotazione manuale della scacchiera
- ⏳ Avviso minacce per principianti (stile ChessKid, collegabile alla lezione CCM)
- ⏳ Offerta di patta contro il bot (minore)

⏳ = backlog, ordinato per valore percepito nelle recensioni: 1) undo, 2) hint,
3) suoni, 4) avviso minacce (che per noi è anche educativo), 5) flip board.

## 4. Implicazioni per la calibrazione dei bot (0–10)

Design implementato (parametri preliminari, da validare su partite reali come
da PRD §13.3):

| Liv. | Nome | Comportamento percepito | Leve |
|---|---|---|---|
| 0 | Casuale | muove quasi a caso | 85% mosse casuali, profondità 1, temp. 1000 |
| 1 | Distratto | vede solo catture ovvie | 50% casuali, prof. 1 |
| 2 | Alle prime armi | nota minacce immediate | 30% casuali, prof. 2 |
| 3 | Principiante | sviluppa ma sbaglia spesso | 15% casuali, prof. 3 |
| 4 | Apprendista | tattiche semplici | 7% casuali, prof. 5 |
| 5 | Amatoriale | equilibrato | 3% casuali, prof. 6 |
| 6 | Attento | punisce errori evidenti | prof. 8, temp. 90 |
| 7 | Stratega | piani semplici | prof. 10, temp. 60 |
| 8 | Giocatore di circolo | solido | prof. 12, temp. 35 |
| 9 | Maestro | quasi perfetto | prof. 14, temp. 15 |
| 10 | Motore | mossa migliore | prof. 16, MultiPV 1 |

Regole ereditate dal PRD: nessun Elo dichiarato finché non validato; la
percezione va testata con giocatori reali; i parametri sono iterabili senza
cambiare architettura.

## 5. Fonti

- [Chess.com Forum — What's So Bad About Bots?](https://www.chess.com/forum/view/for-beginners/whats-so-bad-about-bots)
- [Chess.com Forum — At What Point Do The Bots Stop Making Egregious Blunders?](https://www.chess.com/forum/view/game-analysis/at-what-point-do-the-chess-com-bots-stop-making-egregious-blunders)
- [Chess.com Forum — Chess bots with less obvious blunders?](https://www.chess.com/forum/view/for-beginners/chess-bots-with-less-obvious-blunders)
- [Chess.com Blog — Are Chess.com Bots' Ratings Accurate?](https://www.chess.com/blog/AdviceCabinet/are-chess-com-bots-ratings-accurate)
- [Unstar — 5 Chess Apps Ranked (chess.com, Lichess, ChessKid, Dr. Wolf)](https://unstar.app/blog/chess-com-lichess-play-magnus-chesskid-dr-wolf-chess-apps-ranked-2026)
- [The Chess Advisor — Review of Learn Chess with Dr. Wolf](https://thechessadvisor.com/app-review/learn-chess-with-dr-wolf/)
- [Chessable Blog — Top Chess Apps for Beginners](https://www.chessable.com/blog/top-chess-apps-for-beginners/)
- [CheckmateX — Best Chess Apps 2026](https://checkmatex.app/blog/best-chess-apps-2026-review)
- [ChessKid — Complete Guide to Features](https://www.chesskid.com/learn/articles/complete-guide-to-chesskid)
