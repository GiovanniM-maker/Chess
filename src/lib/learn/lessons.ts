import type { MomentType } from "@/lib/types";
import type { ChapterId, Lesson } from "./types";

export const CHAPTERS: { id: ChapterId; title: string; description: string }[] = [
  {
    id: "fondamenti",
    title: "Fondamenti",
    description: "Le basi che decidono il 90% delle partite tra principianti.",
  },
  {
    id: "tattiche",
    title: "Tattiche",
    description: "I colpi che vincono materiale: impara a vederli (e a non subirli).",
  },
  {
    id: "aperture",
    title: "Aperture",
    description: "Come iniziare bene la partita, con una vera apertura da usare subito.",
  },
  {
    id: "strategia",
    title: "Strategia",
    description: "Dove mettere i pezzi quando non ci sono tattiche.",
  },
  {
    id: "finali",
    title: "Finali",
    description: "Trasformare il vantaggio in vittoria: i matti fondamentali.",
  },
];

/**
 * Il curriculum del MVP Core: lezioni content-driven (dati, non codice),
 * organizzate in capitoli. Ogni posizione è verificata dai test: le soluzioni
 * devono essere legali, i "#" devono dare matto, i "+" devono dare scacco.
 */
export const LESSONS: Lesson[] = [
  // ─────────────────────────── FONDAMENTI ───────────────────────────
  {
    id: "pezzi-in-presa",
    title: "Non lasciare pezzi in presa",
    chapter: "fondamenti",
    skill: "pezzi-in-presa",
    objective: "Riconoscere i pezzi indifesi: i tuoi da proteggere, quelli avversari da catturare.",
    explanation: [
      "Un pezzo è \"in presa\" quando l'avversario può catturarlo gratis, perché nessuno lo difende. È l'errore più comune in assoluto: la maggior parte delle partite tra principianti si decide qui, non nelle aperture o nelle strategie raffinate.",
      "Come si difende un pezzo? In due modi: proteggendolo con un altro pezzo (così se te lo catturano, ricatturi) oppure spostandolo in una casa sicura.",
      'Prendi questa abitudine, vale più di qualsiasi apertura: dopo aver scelto la mossa, PRIMA di giocarla, guarda il pezzo che stai per muovere e chiediti "nella casa di arrivo, chi lo difende? chi lo attacca?". Se gli attaccanti superano i difensori, è in presa.',
      "E vale anche al contrario: a ogni mossa dell'avversario chiediti se ha appena lasciato qualcosa di indifeso. I regali vanno accettati.",
    ],
    exercises: [
      {
        id: "cattura-alfiere",
        fen: "4k3/8/8/4b3/8/8/4R2P/4K3 w - - 0 1",
        prompt: "L'alfiere nero è rimasto senza difesa: catturalo!",
        solutions: ["Rxe5"],
        hint: "Guarda la colonna della tua torre: cosa incontra salendo?",
        successText: "Esatto! Nessuno difendeva l'alfiere: cattura gratuita.",
      },
      {
        id: "cattura-cavallo",
        fen: "8/4k3/8/2n5/8/8/2R4P/4K3 w - - 0 1",
        prompt: "Un pezzo nero è in presa. Trovalo e catturalo.",
        solutions: ["Rxc5"],
        hint: "Il re nero è troppo lontano per difendere il cavallo.",
        successText: "Perfetto: il cavallo non era difeso da nessuno.",
      },
      {
        id: "cattura-donna",
        fen: "4k3/8/1q6/8/8/8/1R5P/4K3 w - - 0 1",
        prompt: "Persino la donna può restare in presa: approfittane!",
        solutions: ["Rxb6"],
        hint: "Torre e donna sono sulla stessa colonna…",
        successText: "Grande! Catturare una donna indifesa vale quasi una partita.",
      },
    ],
    triggers: ["pezzo-perso"],
    actionReminder:
      "Nella prossima partita, prima di muovere, controlla sempre se il pezzo che sposti resta protetto.",
  },
  {
    id: "valore-pezzi",
    title: "Il valore dei pezzi",
    chapter: "fondamenti",
    skill: "pezzi-in-presa",
    objective: "Sapere quanto vale ogni pezzo per decidere quali scambi convengono.",
    explanation: [
      'Ogni pezzo ha un valore in "punti pedone": pedone 1, cavallo 3, alfiere 3, torre 5, donna 9. Il re non ha prezzo: se lo perdi, la partita è finita.',
      "Questi numeri servono a UNA cosa: decidere gli scambi. Dare un cavallo (3) per una torre (5) conviene; dare una torre (5) per un alfiere (3) di solito no.",
      "Attenzione alla trappola più frequente: una cattura non è buona solo perché è una cattura. Se il pezzo che prendi è difeso, dopo la ricattura potresti aver perso lo scambio. Conta sempre: cosa do, cosa ricevo?",
      "Regola pratica: quando puoi scegliere tra due catture sicure, prendi il pezzo che vale di più.",
    ],
    exercises: [
      {
        id: "scegli-cattura",
        fen: "4k3/8/8/3r4/4p3/2N5/8/4K3 w - - 0 1",
        prompt: "Il tuo cavallo può catturare due pezzi: scegli quello che vale di più.",
        solutions: ["Nxd5"],
        hint: "Torre = 5 punti, pedone = 1. Nessuno dei due è difeso.",
        successText: "Giusto: torre (5) batte pedone (1). Sempre contare il valore.",
      },
      {
        id: "cattura-sicura",
        fen: "3rk3/3p4/8/7r/8/8/8/3QK3 w - - 0 1",
        prompt: "Due catture possibili: una regala la donna, l'altra vince una torre. Scegli bene.",
        solutions: ["Qxh5"],
        hint: "Il pedone d7 è difeso due volte. La torre h5 da nessuno.",
        successText: "Perfetto: Dxd7?? perdeva la donna per un pedone. La torre invece era gratis.",
      },
    ],
    triggers: [],
    actionReminder:
      "Nella prossima partita, prima di ogni cattura conta: cosa do, cosa ricevo, chi ricattura?",
  },

  // ─────────────────────────── TATTICHE ───────────────────────────
  {
    id: "ccm",
    title: "Controlla scacchi, catture e minacce",
    chapter: "tattiche",
    skill: "tattiche",
    objective: "Prendere l'abitudine di cercare le mosse forzanti, tue e dell'avversario.",
    explanation: [
      "Prima di muovere, passa in rassegna tre cose, in quest'ordine: gli SCACCHI possibili, le CATTURE possibili, le MINACCE dell'avversario. È la checklist che usano anche i maestri, solo più in fretta.",
      "Perché in quest'ordine? Le mosse forzanti (scacchi e catture) obbligano l'avversario a reagire: se una funziona, la partita può finire lì. Vale la pena controllarle per prime, sempre.",
      "Il terzo punto è quello che i principianti saltano: cosa MINACCIA l'avversario con la sua ultima mossa? Ogni sua mossa ha uno scopo. Se non lo trovi, rischi di scoprirlo alla mossa dopo — a tue spese.",
      "Questa checklist richiede dieci secondi e previene la maggior parte degli errori gravi. È l'abitudine singola più redditizia degli scacchi.",
    ],
    exercises: [
      {
        id: "trova-scacco",
        fen: "3k4/8/8/8/8/8/4R3/4K2N w - - 0 1",
        prompt: "Primo passo della checklist: trova lo scacco.",
        solutions: ["Re8+", "Re8"],
        hint: "L'ottava traversa è libera per la tua torre.",
        successText: "Giusto! Lo scacco obbliga il re nero a reagire.",
      },
      {
        id: "trova-cattura",
        fen: "k7/8/8/3p4/8/8/7P/K2R4 w - - 0 1",
        prompt: "Secondo passo: trova la cattura gratuita.",
        solutions: ["Rxd5"],
        hint: "Segui la colonna della torre.",
        successText: "Esatto: cattura senza contropartita.",
      },
      {
        id: "para-minaccia",
        fen: "6k1/5ppp/8/8/8/8/r4PPP/6K1 w - - 0 1",
        prompt:
          "Terzo passo: l'avversario minaccia matto sulla prima traversa. Crea una via di fuga per il tuo re.",
        solutions: ["h3", "g3", "h4", "g4"],
        hint: "Il tuo re è chiuso dai suoi stessi pedoni: aprigli una finestrella.",
        successText: "Perfetto: adesso Ta1 non è più matto, il re può scappare.",
      },
    ],
    triggers: ["tattica-mancata", "occasione-mancata"],
    actionReminder:
      "Nella prossima partita, prima di ogni mossa, controlla scacchi, catture e minacce — in questo ordine.",
  },
  {
    id: "tattica-semplice",
    title: "La forchetta",
    chapter: "tattiche",
    skill: "tattiche",
    objective: "Attaccare due pezzi con una sola mossa.",
    explanation: [
      "Una FORCHETTA (o attacco doppio) attacca due bersagli contemporaneamente: l'avversario può salvarne solo uno. È la tattica più frequente in assoluto.",
      "Il cavallo è il re delle forchette: attacca in una forma strana che i principianti non vedono, e nessun pezzo può bloccarlo. Una forchetta di cavallo su re e donna decide la partita.",
      "Ma tutti i pezzi possono dare forchette: la donna (che attacca in tutte le direzioni), i pedoni (una forchetta di pedone su due pezzi è micidiale), perfino il re nei finali.",
      "Come trovarle: cerca pezzi avversari NON DIFESI o il re. Se due di questi bersagli sono raggiungibili da una stessa casa… c'è una forchetta.",
    ],
    exercises: [
      {
        id: "forchetta-cavallo",
        fen: "k3r3/8/8/1N6/8/8/7P/K7 w - - 0 1",
        prompt: "Trova la forchetta di cavallo: attacca re e torre insieme.",
        solutions: ["Nc7+", "Nc7"],
        hint: "Cerca la casa da cui il cavallo dà scacco E attacca la torre.",
        successText: "Forchetta perfetta! Il re deve muoversi e la torre è tua.",
      },
      {
        id: "matto-in-1",
        fen: "6k1/5ppp/8/8/8/8/7P/4R2K w - - 0 1",
        prompt: "C'è un matto in una mossa: trovalo.",
        solutions: ["Re8#"],
        hint: "Il re nero è chiuso dai suoi pedoni: attaccalo sulla traversa di fondo.",
        successText: "Scacco matto! Il classico matto della prima traversa.",
      },
      {
        id: "forchetta-donna",
        fen: "3r4/8/1k6/8/8/8/3Q3P/6K1 w - - 0 1",
        prompt: "La donna può attaccare re e torre con una sola mossa.",
        solutions: ["Qd6+", "Qd6"],
        hint: "Cerca la casa da cui la donna vede sia il re (in orizzontale) sia la torre (in verticale).",
        successText: "Esatto: dopo lo scacco, la torre cade.",
      },
    ],
    triggers: ["tattica-mancata", "occasione-mancata"],
    actionReminder:
      "Nella prossima partita, quando vedi due pezzi avversari non difesi, cerca la casa che li attacca entrambi.",
  },
  {
    id: "inchiodatura",
    title: "L'inchiodatura",
    chapter: "tattiche",
    skill: "tattiche",
    objective: "Bloccare un pezzo avversario dietro cui c'è qualcosa di più prezioso.",
    explanation: [
      "Un pezzo è INCHIODATO quando non può (o non conviene che) muoversi, perché dietro di lui — sulla stessa linea — c'è qualcosa di più prezioso: il re o la donna.",
      "Se dietro c'è il RE, l'inchiodatura è assoluta: muovere quel pezzo è proprio illegale. Il pezzo inchiodato è paralizzato.",
      "Solo i pezzi che si muovono in linea possono inchiodare: alfieri, torri e donna. L'inchiodatura d'alfiere più famosa è Ab5 (o Ag5): inchioda il cavallo al re fin dall'apertura.",
      "Un pezzo inchiodato è un bersaglio: non può scappare, quindi attaccalo ancora — spesso con un pedone — e raccoglilo.",
    ],
    exercises: [
      {
        id: "inchioda-cavallo",
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        prompt: "Inchioda il cavallo nero al suo re con l'alfiere.",
        solutions: ["Bb5"],
        hint: "Cerca la diagonale che passa per il cavallo c6 e arriva al re e8.",
        successText: "Questa è la Partita Spagnola! Il cavallo c6 ora è un bersaglio.",
      },
      {
        id: "sfrutta-inchiodatura",
        fen: "4k3/8/8/4n3/8/8/5PPP/4R1K1 w - - 0 1",
        prompt: "Il cavallo nero è inchiodato al re: guadagnalo.",
        solutions: ["Rxe5+", "Rxe5", "f4"],
        hint: "Il cavallo non può muoversi (scoprirebbe il re): è indifeso oppure attaccabile col pedone.",
        successText: "Esatto: un pezzo inchiodato non può scappare. Era tuo in ogni caso.",
      },
    ],
    triggers: [],
    actionReminder:
      "Nella prossima partita, quando un pezzo avversario è allineato col suo re, cerca l'inchiodatura.",
  },
  {
    id: "infilata",
    title: "L'infilata",
    chapter: "tattiche",
    skill: "tattiche",
    objective: "Costringere un pezzo prezioso a spostarsi per catturare quello dietro.",
    explanation: [
      "L'INFILATA è l'inchiodatura al contrario: il pezzo di valore sta DAVANTI. Lo attacchi, lui è costretto a spostarsi… e tu catturi quello che c'era dietro.",
      "La versione più forte è con lo scacco: attacchi il re su una linea, il re deve muoversi, e dietro di lui c'era la donna o una torre. Non c'è difesa.",
      "Come per l'inchiodatura servono pezzi che si muovono in linea: torri, alfieri, donna.",
      "Come accorgersene: ogni volta che re e donna avversari (o re e torre) finiscono sulla stessa riga, colonna o diagonale, fermati un secondo. Spesso c'è un colpo.",
    ],
    exercises: [
      {
        id: "infilata-torre",
        fen: "8/8/8/q3k3/8/8/6P1/5K1R w - - 0 1",
        prompt: "Re e donna neri sono sulla stessa traversa: infilzali!",
        solutions: ["Rh5+"],
        hint: "Dai scacco sulla quinta traversa: il re dovrà spostarsi…",
        successText: "Infilata! Il re deve muoversi e alla prossima mossa prendi la donna.",
      },
      {
        id: "infilata-riconosci",
        fen: "q7/8/8/3k4/8/8/8/6KB w - - 0 1",
        prompt: "Re e donna neri sono sulla stessa diagonale: infilzali con l'alfiere!",
        solutions: ["Bf3+", "Bf3"],
        hint: "L'alfiere in angolo vede tutta la grande diagonale: dai scacco al re e la donna, dietro, è perduta.",
        successText: "Infilata di alfiere! Il re deve lasciare la diagonale e la donna in a8 cade.",
      },
    ],
    triggers: [],
    actionReminder:
      "Nella prossima partita, quando re e donna avversari sono allineati, cerca scacco su quella linea.",
  },
  {
    id: "scoperta",
    title: "L'attacco di scoperta",
    chapter: "tattiche",
    skill: "tattiche",
    objective: "Muovere un pezzo per scatenare l'attacco di quello dietro.",
    explanation: [
      "Nell'ATTACCO DI SCOPERTA muovi un pezzo e, così facendo, \"scopri\" l'attacco di un pezzo che stava dietro di lui. Il bello: il pezzo che si muove può fare qualsiasi cosa nel frattempo.",
      "La versione devastante è lo SCACCO DI SCOPERTA: il pezzo dietro dà scacco, e quello che si muove è libero di catturare quello che vuole. L'avversario deve rispondere allo scacco e non può salvare il pezzo catturato.",
      "È la tattica preferita di cavalli e pedoni davanti ad alfieri, torri e donne: i pezzi che saltano o avanzano liberano le linee di quelli che sparano da lontano.",
      "Come costruirla: se un tuo alfiere o torre punta verso il re nemico ma un TUO pezzo è in mezzo, hai una scoperta pronta. Scegli il momento in cui il pezzo che si muove fa più danno.",
    ],
    exercises: [
      {
        id: "scacco-scoperta",
        fen: "7k/3q1p1p/8/4N3/8/8/1B4PP/6K1 w - - 0 1",
        prompt:
          "Il tuo alfiere punta al re nero, ma il cavallo è in mezzo. Muovilo… facendo bottino!",
        solutions: ["Nxd7+", "Nxd7"],
        hint: "Quando il cavallo si sposta, l'alfiere dà scacco: il cavallo può catturare qualsiasi cosa.",
        successText: "Scacco di scoperta! Il Nero deve pensare al re: la donna è tua gratis.",
      },
      {
        id: "riconosci-batteria",
        fen: "7k/8/8/8/8/2N5/1B4PP/6K1 w - - 0 1",
        prompt:
          'Alfiere e cavallo sono in "batteria". Muovi il cavallo dando scacco di scoperta E attaccando qualcosa? Qui non c\'è bottino: dai semplicemente lo scacco di scoperta più naturale.',
        solutions: [
          "Nd5+",
          "Nd5",
          "Ne4+",
          "Ne4",
          "Na4+",
          "Na4",
          "Nb5+",
          "Nb5",
          "Ne2+",
          "Ne2",
          "Nd1+",
          "Nd1",
          "Nb1+",
          "Nb1",
          "Na2+",
          "Na2",
        ],
        hint: "QUALSIASI mossa di cavallo scopre l'alfiere b2 verso il re: è questo il potere della batteria.",
        successText: "Esatto: con una batteria carica, ogni mossa del pezzo davanti è uno scacco.",
      },
    ],
    triggers: [],
    actionReminder:
      "Nella prossima partita, se un tuo pezzo a lunga gittata è bloccato da un tuo pezzo, chiediti cosa succede muovendolo.",
  },

  // ─────────────────────────── APERTURE ───────────────────────────
  {
    id: "sviluppo",
    title: "I tre principi dell'apertura",
    chapter: "aperture",
    skill: "sviluppo",
    objective: "Centro, sviluppo, arrocco: iniziare ogni partita con un piano solido.",
    explanation: [
      "Non serve memorizzare venti mosse di teoria. In apertura bastano tre principi: 1) occupa o controlla il CENTRO (le case e4-d4-e5-d5), 2) SVILUPPA cavalli e alfieri, 3) metti il re al sicuro con l'ARROCCO.",
      "Perché il centro? Un pezzo al centro controlla più case e arriva prima ovunque. Un cavallo in f3 vale il doppio di uno in h3.",
      "Ogni mossa d'apertura è preziosa: usala per portare un pezzo NUOVO in gioco, non per muovere due volte lo stesso. Chi sviluppa più in fretta comanda la partita.",
      "E la donna? Esce per ultima. Se la porti fuori presto, l'avversario la scaccia con mosse di sviluppo: lui migliora la posizione, tu perdi tempo. Doppio danno.",
    ],
    exercises: [
      {
        id: "sviluppa-cavallo",
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
        prompt: "Sviluppa un cavallo verso il centro.",
        solutions: ["Nf3", "Nc3"],
        hint: "I cavalli amano le case f3 e c3.",
        successText: "Ottimo: un pezzo nuovo in gioco, e il centro è sotto controllo.",
      },
      {
        id: "sviluppa-alfiere",
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        prompt: "Il cavallo è già sviluppato: ora tocca all'alfiere.",
        solutions: ["Bc4", "Bb5"],
        hint: "L'alfiere di re ha due buone diagonali: verso f7 o verso c6.",
        successText: "Bene! Un altro pezzo sviluppato: sei pronto ad arroccare.",
      },
      {
        id: "completa-sviluppo",
        fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        prompt: "Continua lo sviluppo: un pezzo nuovo o il re al sicuro.",
        solutions: ["O-O", "Nc3", "d3"],
        hint: "Arroccare o sviluppare l'altro cavallo: entrambe ottime.",
        successText: "Esatto: niente avventure con la donna, prima si completa lo sviluppo.",
      },
    ],
    triggers: ["problema-sviluppo"],
    actionReminder: "Nella prossima partita sviluppa un pezzo nuovo a ogni mossa d'apertura.",
  },
  {
    id: "apertura-italiana",
    title: "La tua prima apertura: l'Italiana",
    chapter: "aperture",
    skill: "sviluppo",
    objective:
      "Un'apertura completa, solida e facile da ricordare, da usare in ogni partita col Bianco.",
    explanation: [
      "La Partita Italiana è l'apertura perfetta per iniziare: segue alla lettera i tre principi (centro, sviluppo, arrocco) ed è giocata da mille anni — anche dai campioni del mondo.",
      "Le mosse: 1.e4 (occupi il centro e liberi l'alfiere), poi Cf3 (sviluppi attaccando il pedone e5), poi Ac4 (l'alfiere punta f7, il punto più debole del Nero: è difeso solo dal re), infine l'arrocco.",
      "Dopo queste quattro mosse hai: due pezzi sviluppati, il centro presidiato, il re al sicuro e una torre pronta. Da lì in poi: sviluppa cavallo b1 e alfiere c1, e la partita è tua da giocare.",
      "Il bello di un'apertura basata sui principi: anche se l'avversario gioca mosse strane, tu sai sempre cosa fare — sviluppare il prossimo pezzo.",
    ],
    exercises: [
      {
        id: "italiana-1",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        prompt: "Prima mossa dell'Italiana: occupa il centro col pedone di re.",
        solutions: ["e4"],
        hint: "Due case avanti col pedone davanti al re.",
        successText: "1.e4 — 'best by test', diceva Bobby Fischer.",
      },
      {
        id: "italiana-2",
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
        prompt: "Seconda mossa: sviluppa il cavallo ATTACCANDO il pedone e5.",
        solutions: ["Nf3"],
        hint: "Il cavallo di re, verso il centro.",
        successText: "2.Cf3: sviluppo CON minaccia. Il Nero è già costretto a difendersi.",
      },
      {
        id: "italiana-3",
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        prompt: "Terza mossa: l'alfiere punta al tallone d'Achille del Nero, la casa f7.",
        solutions: ["Bc4"],
        hint: "La diagonale che da c4 guarda dritto verso f7.",
        successText: "3.Ac4: questa È l'Italiana. f7 è difeso solo dal re…",
      },
      {
        id: "italiana-4",
        fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        prompt: "Il Nero ha copiato le tue mosse. Completa il piano dell'apertura.",
        solutions: ["O-O"],
        hint: "Sviluppo fatto: cosa manca al tuo re?",
        successText: "Arrocco: piano completato. Ora hai una partita sana davanti.",
      },
    ],
    triggers: [],
    actionReminder: "Nella prossima partita col Bianco gioca l'Italiana: e4, Cf3, Ac4, arrocco.",
  },
  {
    id: "errori-apertura",
    title: "Gli errori tipici d'apertura (e come punirli)",
    chapter: "aperture",
    skill: "sviluppo",
    objective: "Riconoscere i trucchi da principiante e non caderci mai più.",
    explanation: [
      "Ci sono errori d'apertura che vedrai in continuazione: la donna che esce alla seconda mossa a caccia del matto veloce, i pedoni laterali mossi senza motivo, lo stesso pezzo mosso tre volte.",
      "L'attacco della donna presto (tipo 2.Dh5) FA PAURA ma è debole: se rispondi con calma sviluppando i pezzi giusti, l'avversario dovrà ritirare la donna perdendo tempo, e tu avrai una posizione migliore. Il segreto: difendi SVILUPPANDO, mai indebolendoti.",
      "E i pedoni davanti al re? Muoverli senza motivo (f3, g4…) apre autostrade verso il tuo re. Il matto più veloce degli scacchi — il Matto dell'Imbecille, 2 mosse — nasce esattamente da lì.",
      "Ricorda: non devi punire questi errori con violenza immediata. Basta sviluppare meglio di chi li commette: il vantaggio arriva da solo.",
    ],
    exercises: [
      {
        id: "difendi-da-qh5",
        fen: "rnbqkbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2",
        prompt:
          "Il Bianco ha tirato fuori la donna subito: minaccia il pedone e5 (e poi f7). Difendi SVILUPPANDO un pezzo. (Attento: g6 sarebbe un errore!)",
        solutions: ["Nc6"],
        hint: "Quale pezzo difende e5 e intanto si sviluppa? (Dopo g6?? arriverebbe Dxe5+ con forchetta sulla torre!)",
        successText:
          "Perfetto: Cc6 difende e5 sviluppando. La donna bianca ora è solo un bersaglio.",
      },
      {
        id: "punisci-pedoni",
        fen: "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2",
        prompt:
          "Il Bianco ha mosso due pedoni davanti al re, aprendo la diagonale fatale. Puniscilo: matto in una!",
        solutions: ["Qh4#"],
        hint: "La diagonale e1-h4 è spalancata e nessun pezzo bianco può bloccarla.",
        successText:
          "Il Matto dell'Imbecille! Ecco perché non si muovono i pedoni davanti al re senza motivo.",
      },
    ],
    triggers: [],
    actionReminder:
      "Nella prossima partita, se l'avversario esce presto con la donna, difenditi sviluppando: mai muovere pedoni per paura.",
  },
  {
    id: "re-sicuro",
    title: "Metti al sicuro il re",
    chapter: "aperture",
    skill: "re-sicuro",
    objective: "Arroccare presto e tenere il re protetto.",
    explanation: [
      "Il re al centro è un bersaglio: quando le colonne centrali si aprono — e prima o poi si aprono — gli scacchi piovono e la partita finisce in fretta.",
      "L'arrocco fa due cose in una mossa sola: nasconde il re dietro un muro di pedoni e porta la torre verso il centro, dove serve. È l'unica mossa degli scacchi che muove due pezzi: approfittane.",
      "Regola pratica: arrocca entro la decima mossa, salvo ottimi motivi. E dopo l'arrocco, non muovere i pedoni davanti al re senza necessità: ogni pedone mosso è una crepa nel muro.",
      'Ultima cosa: attento al matto della prima traversa. Se il tuo re è chiuso dai suoi pedoni e le torri spariscono dalla prima fila, una torre avversaria può entrare e dare matto. Una "finestrella" (h3) risolve tutto.',
    ],
    exercises: [
      {
        id: "arrocca",
        fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        prompt: "Il tuo re è ancora al centro: mettilo al sicuro.",
        solutions: ["O-O"],
        hint: "Hai già sviluppato cavallo e alfiere: la strada per l'arrocco corto è libera.",
        successText: "Perfetto: re al sicuro e torre pronta a giocare.",
      },
      {
        id: "arrocca-spagnola",
        fen: "r1bqkbnr/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
        prompt: "Anche qui: prima di attaccare, sistema il re.",
        solutions: ["O-O"],
        hint: "L'ala di re è già sgombra.",
        successText: "Bene! Ora puoi pensare all'attacco senza rischi.",
      },
      {
        id: "via-di-fuga",
        fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
        prompt:
          "Il tuo re è chiuso in casa: preparagli una via di fuga prima che sia troppo tardi.",
        solutions: ["h3", "g3", "h4", "g4"],
        hint: "Muovi un pedone davanti al re per aprire una finestrella.",
        successText: "Giusto: mai farsi sorprendere da un matto della prima traversa.",
      },
    ],
    triggers: ["re-esposto"],
    actionReminder: "Nella prossima partita arrocca entro la decima mossa.",
  },

  // ─────────────────────────── STRATEGIA ───────────────────────────
  {
    id: "colonne-aperte",
    title: "Le torri amano le colonne aperte",
    chapter: "strategia",
    skill: "tattiche",
    objective: "Dove mettere le torri quando non sai cosa fare.",
    explanation: [
      "Le torri sono i pezzi più difficili da attivare: partono chiuse negli angoli e restano inutili per metà partita. La strategia più semplice degli scacchi è dar loro una strada.",
      "Una colonna è APERTA quando non ci sono più pedoni sopra: lì la torre spara per tutta la scacchiera. Regola d'oro: appena una colonna si apre, mettici una torre — prima che lo faccia l'avversario.",
      "Il premio finale è la SETTIMA TRAVERSA (la seconda dell'avversario): una torre lì attacca tutti i pedoni rimasti a casa e imprigiona il re avversario. I maestri la chiamano 'la torre in settima vale un pedone'.",
      "Quando non sai cosa muovere e non ci sono tattiche: migliora la posizione del tuo pezzo peggiore. Spesso è proprio una torre.",
    ],
    exercises: [
      {
        id: "occupa-colonna",
        fen: "3r2k1/ppp1pppp/8/8/8/8/PPP1PPPP/R5K1 w - - 0 1",
        prompt:
          "C'è una sola colonna senza pedoni: portaci subito la torre, prima che sia solo sua.",
        solutions: ["Rd1"],
        hint: "Cerca la colonna dove non ci sono pedoni, né tuoi né suoi.",
        successText: "Esatto: ora la colonna d è contesa, non regalata.",
      },
      {
        id: "settima-traversa",
        fen: "6k1/ppp2ppp/8/8/8/8/PPP2PPP/3R2K1 w - - 0 1",
        prompt: "La colonna è tua: porta la torre in settima traversa, a banchettare tra i pedoni.",
        solutions: ["Rd7"],
        hint: "La traversa dove vivono i pedoni neri rimasti a casa.",
        successText: "Torre in settima: attacca a7, b7, c7… e il re non può uscire.",
      },
    ],
    triggers: [],
    actionReminder: "Nella prossima partita, appena si apre una colonna, mettici una torre.",
  },

  // ─────────────────────────── FINALI ───────────────────────────
  {
    id: "matto-donna",
    title: "Il matto con la donna",
    chapter: "finali",
    skill: "finali",
    objective: "Chiudere la partita quando resti con donna e re — senza pattare per sbaglio.",
    explanation: [
      "Hai vinto la donna, l'avversario ha solo il re… e adesso? Tanti principianti girano a vuoto per 30 mosse o — peggio — pattano per stallo. Il metodo è semplice.",
      'Fase 1: con la donna, chiudi il re avversario in una "scatola" sempre più piccola, spingendolo verso il bordo. La donna da sola lo fa: mettila a distanza di cavallo dal re e copialo mossa dopo mossa.',
      "Fase 2: quando il re è sul bordo, FERMA la donna e porta il TUO re vicino. Per dare matto servono entrambi.",
      "L'unico pericolo è lo STALLO: se il re avversario non è sotto scacco ma non ha mosse legali, è patta — e butti via la partita vinta. Regola: finché il tuo re non è arrivato, lascia sempre al re nemico almeno due case libere.",
    ],
    exercises: [
      {
        id: "matto-donna-1",
        fen: "7k/8/6K1/8/8/8/2Q5/8 w - - 0 1",
        prompt: "Il tuo re è arrivato: dai scacco matto con la donna.",
        solutions: ["Qc8#"],
        hint: "Serve uno scacco sulla traversa di fondo: le case di fuga le copre il tuo re.",
        successText: "Matto! Donna e re che collaborano: questo è il finale fondamentale.",
      },
      {
        id: "matto-donna-antistallo",
        fen: "k7/8/1K6/6Q1/8/8/8/8 w - - 0 1",
        prompt:
          "Dai matto in una mossa — ma attento: c'è una mossa che sembra forte e invece è STALLO!",
        solutions: ["Qd8#", "Qg8#"],
        hint: "Db5?? non dà scacco e toglie al re ogni casa: patta! Cerca invece lo scacco sulla traversa di fondo.",
        successText: "Perfetto: matto, non stallo. Questa distinzione vale mezzo punto a partita.",
      },
    ],
    triggers: [],
    actionReminder:
      "Nella prossima partita vinta, prima di ogni mossa in finale chiediti: l'avversario avrà ancora una mossa legale?",
  },
  {
    id: "matto-torre",
    title: "Il matto con la torre (e la scala)",
    chapter: "finali",
    skill: "finali",
    objective: "I due matti meccanici che ogni giocatore deve saper eseguire a occhi chiusi.",
    explanation: [
      "Il MATTO DELLA SCALA (con due torri, o torre e donna): le due torri si alternano dando scacco su traverse adiacenti, come i pioli di una scala, spingendo il re fino al bordo. Il re nemico non può mai avvicinarsi: una torre difende l'altra a distanza.",
      "Con UNA torre sola serve il tuo re: la torre taglia la scacchiera come un muro, il tuo re si mette faccia a faccia col re nemico, e quando i re si fronteggiano la torre dà scacco sulla traversa: matto.",
      'Sono matti "meccanici": non serve creatività, serve il metodo. Ma vanno saputi, perché una partita vinta che finisce patta per incapacità di dare matto fa malissimo.',
      "Anche qui, il nemico è lo stallo: la torre — a differenza della donna — raramente lo causa, ed è per questo che il finale di torre è il più indulgente da imparare per primo.",
    ],
    exercises: [
      {
        id: "matto-scala",
        fen: "k7/6R1/8/8/8/8/8/6KR w - - 0 1",
        prompt:
          "Le tue torri hanno spinto il re nero al bordo con la scala: chiudi con l'ultimo piolo.",
        solutions: ["Rh8#"],
        hint: "Una torre tiene la settima traversa, l'altra dà matto sull'ottava.",
        successText: "Il matto della scala! Due torri: nessun re può scappare.",
      },
      {
        id: "matto-torre-re",
        fen: "4k3/8/4K3/8/8/8/8/R7 w - - 0 1",
        prompt: "I re sono faccia a faccia: è il momento esatto del matto di torre.",
        solutions: ["Ra8#"],
        hint: "Il tuo re copre tutte le case di fuga: alla torre resta solo la traversa di fondo.",
        successText:
          "Matto! Re contro re, torre sulla traversa: il finale fondamentale numero uno.",
      },
    ],
    triggers: [],
    actionReminder:
      "Nella prossima partita vinta, porta il TUO re nel finale: senza di lui la torre non matta.",
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

/** Lezione consigliata per un tipo di errore della review (prima corrispondenza). */
export function lessonForMoment(type: MomentType): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.triggers.includes(type));
}

/** Confronto tra SAN ignorando i suffissi di scacco/matto ("Re8" ≡ "Re8#"). */
export function sanEquals(a: string, b: string): boolean {
  const normalize = (san: string) => san.replace(/[+#]/g, "");
  return normalize(a) === normalize(b);
}
