# Come si impara DAVVERO a giocare a scacchi

> Documento di ragionamento richiesto dal Product Owner prima di espandere
> lezioni e gamification. Non è un piano di implementazione: è la base di
> discussione per decidere COSA costruire. Collegato al PRD (Parte I).

## 1. La domanda giusta

Non è "quante lezioni servono?" ma: **cosa fa passare una persona da 400 a
1200 Elo?** La risposta, supportata da decenni di didattica scacchistica, è
scomoda per chi progetta app:

1. **Sotto i 1200, quasi tutte le partite si decidono su pezzi regalati.**
   Non su aperture, non su strategia: su pezzi lasciati in presa e tattiche
   da una mossa non viste. Il fondamentale numero uno è la "board vision":
   vedere cosa è attaccato, ADESSO, su tutta la scacchiera.
2. **La conoscenza non è la competenza.** Sapere cos'è una forchetta (5
   minuti) e vederla in partita sotto pressione (mesi di pratica) sono due
   abilità diverse. Le app che spiegano tanto e fanno praticare poco
   producono utenti che "sanno" e perdono.
3. **Le aperture hanno il ROI più basso** sotto i 1400 — ma il più alto
   valore PERCEPITO (tutti le chiedono). La risposta giusta non è teoria:
   è UNA apertura per colore basata sui principi + il perché delle mosse.

## 2. Cosa dice la scienza dell'apprendimento

| Principio | Cosa significa | Cosa implica per noi |
|---|---|---|
| **Pratica deliberata** | Esercizio mirato sul punto debole specifico, con feedback immediato | Gli esercizi devono venire dagli errori REALI dell'utente (già lo facciamo con la review; va chiuso il cerchio) |
| **Retrieval practice** | Risolvere > rileggere. Il richiamo attivo consolida, la rilettura illude | Lezioni = 20% spiegazione, 80% esercizi. Mai quiz a crocette: mosse sulla scacchiera |
| **Ripetizione spaziata** | Rivedere a intervalli crescenti (1, 3, 7, 21 giorni) batte il ripasso ammassato | Gli esercizi falliti e gli errori di partita devono RITORNARE, non sparire dopo il completamento |
| **Interleaving** | Mischiare i temi negli esercizi di ripasso batte i blocchi monotematici | Sessione di ripasso quotidiana mista ("i tuoi 5 esercizi di oggi"), non solo lezioni a capitoli |
| **Transfer** | La competenza si dimostra nel contesto reale, non nell'esercizio | **Il test finale di ogni lezione è la PARTITA**, non l'ultimo esercizio |
| **Carico cognitivo** | Un concetto nuovo alla volta | Già nei Product Principles (I.C) |
| **Motivazione (SDT)** | Competenza percepita + autonomia + scopo battono i punti | Il progresso VISIBILE (memoria §I.F) motiva più degli XP |

## 3. Il modello: il Mastery Loop

L'idea centrale che unisce tutto — ed è ciò che NESSUNA app concorrente fa:

```
LEZIONE (concetto + esercizi)
   ↓  si chiude con UNA missione comportamentale
PARTITA VERA (la missione è attiva: "arrocca entro la 10ª")
   ↓  la review classifica gli errori (già deterministica!)
VERIFICA AUTOMATICA (hai applicato il concetto? l'errore è sparito?)
   ↓  sì → competenza avanza verso "stabile"
   ↓  no → l'errore diventa esercizio di ripasso (SRS)
RIPASSO SPAZIATO (1-3-7 giorni, temi misti)
   ↺
```

**Una lezione non è "completata" quando finisci gli esercizi: è APPRESA
quando l'errore corrispondente smette di comparire nelle tue partite.**
Questo è misurabile con l'infrastruttura che abbiamo già (classificatore
della review + skill profile). Chess.com non può dirlo, Duolingo non può
dirlo: noi sì. È la killer feature, più di qualsiasi quantità di lezioni.

## 4. I fondamentali, in ordine di impatto (400→1400)

1. **Non regalare pezzi** (board vision, conteggio attaccanti/difensori) — vale ~400 punti Elo da solo
2. **Checklist CCM** (scacchi, catture, minacce — anche dell'avversario) — l'abitudine anti-impulsività
3. **Tattiche a 1-2 mosse** (forchetta, inchiodatura, infilata, scoperta, matti in 1-2) — a volume, con SRS
4. **I matti elementari** (donna, torre, scala) — senza, le partite vinte diventano patte
5. **Principi d'apertura + UNA apertura per colore** — non teoria: capire il perché
6. **Finali di pedone basilari** (promozione, opposizione, quadrato)
7. **Strategia minima** (colonne aperte, pezzo peggiore, quando cambiare)

Il curriculum attuale (14 lezioni) copre 1, 2, 3 (parziale), 4, 5 e un
assaggio di 7. I buchi principali: volume tattico con ripetizione (3),
finali di pedone (6), e — trasversale — **il ripasso spaziato non esiste
ancora**.

## 5. La gamification GIUSTA (e quella sbagliata)

**Sbagliata** (già esclusa dal PRD, confermata dalla ricerca UX): premiare
login, tempo, numero di partite, XP per attività. Produce engagement senza
apprendimento — e gli utenti se ne accorgono ("non diverso da chess.com").

**Giusta** — ogni ricompensa aggancia un comportamento che fa migliorare:

| Meccanica | Aggancio | Esempio |
|---|---|---|
| Missione post-lezione | Transfer | "Arrocca entro la 10ª nella prossima partita" → verificata dalla review |
| Streak comportamentale | Abitudine | "3 partite di fila senza pezzi regalati" (non "3 giorni di login") |
| Badge di mastery | Competenza | "Prima partita senza errori gravi", "Il matto di torre non ti sfugge più" |
| Ripasso del giorno | SRS | "I tuoi 5 esercizi di oggi" (misti, dai TUOI errori) |
| Progresso visibile | Motivazione | La memoria (§I.F): "un mese fa... oggi non più" |
| Sblocco capitoli | Percorso | Il capitolo successivo si apre con la mastery, non col completamento |

## 6. Priorità proposte (da discutere, NON ancora da costruire)

1. **Mastery Loop v1** — la missione dell'actionReminder diventa attiva e
   verificata nella partita successiva (l'infrastruttura c'è: classifier +
   skill). È il cuore differenziante. *Complessità: media.*
2. **Ripasso spaziato v1** — coda "esercizi di oggi": esercizi falliti +
   puzzle dagli errori di partita, riproposti a 1/3/7 giorni. *Media.*
3. **Streak comportamentali + badge di mastery** (pochi, veri). *Bassa.*
4. **Volume tattico** — 30-50 esercizi extra per il capitolo Tattiche,
   alimentano il ripasso (più esercizi, non più lezioni). *Bassa-media
   (authoring verificato).*
5. **Finali di pedone** (2 lezioni: promozione/quadrato, opposizione). *Bassa.*
6. Solo dopo: espansione ulteriore delle lezioni.

## 6-bis. Decisioni dal confronto col PO (2026-07)

**Principio guida confermato: "l'utente deve migliorare senza accorgersene".**
L'app decide per l'utente, una cosa alla volta (anti-pattern chess.com: 15
sezioni e auto-direzione impossibile per un principiante). Il miglioramento
si mostra solo a posteriori (memoria §I.F).

**Il Rivale (idea del PO, adottata come spina dorsale della progressione):**
- Calibrazione iniziale: 2-3 partite contro bot adattivo (parte L3; vittoria
  +2, sconfitta -1) → assegnazione del "Rivale" personale. È il test
  d'ingresso del PRD, in forma di gioco.
- La home propone "Sfida il tuo Rivale" (mai più scelta del livello).
- Promozione: batti il Rivale con costanza (es. 3 su 5) → celebrazione e il
  Rivale sale di livello. Battere bot più forti = miglioramento oggettivo.

**Sistema reward (adottato, con un vincolo):**
- Gradi (Legno→Bronzo→Argento→Oro→Platino→Diamante) = livello di Rivale
  DOMINATO, mai volume di partite (il "1000 partite = platino" premia il
  grinding: escluso, coerente con Principio 3 del PRD).
- Titoli guadagnati con comportamenti verificati dalla review ("Mai più
  regali", "Campione d'arrocco", "Cacciatore di forchette").
- Celebrazioni di volume (100ª partita) come festa, non come grado.
- Sticker collezionabili: sbloccati con promozioni/titoli, usabili nelle
  partite con amici.

**Home a una azione:** un solo bottone principale ("Inizia") che contiene il
loop: riscaldamento 2' (SRS sugli errori propri) → partita col Rivale con
missione attiva → review → eventuale micro-lezione. Le altre sezioni restano
secondarie.

**Ordine di costruzione concordato:**
1. Home a una azione + Mastery Loop
2. Calibrazione + Rivale
3. Riscaldamento (ripasso spaziato)
4. Gradi + Titoli + streak comportamentali
5. Sticker nel friend mode

## 7. Domande per il Product Owner

1. Confermi la priorità **Mastery Loop prima del volume di contenuti**?
2. Il **ripasso del giorno** dev'essere l'entrata principale dell'app
   ("Duolingo-style": apri e hai i tuoi 5 esercizi) o una sezione?
3. Streak comportamentale: quale comportamento premiamo per primo?
   (proposta: "partite senza pezzi regalati")
4. Quanta pressione sociale/competitiva vuoi? (proposta: zero, come da PRD)
