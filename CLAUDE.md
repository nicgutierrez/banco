# Banco

Sito personale di studio per preparare da privatista l'**esame di idoneità** del primo biennio di un istituto tecnico (indirizzo informatico), e poi la maturità. Un solo utente: Nic, adulto che lavora come programmatore e studia quando riesce, la sera, dal computer.

## Decisioni prese (non rimetterle in discussione senza chiedere)

- **Niente calendario né obiettivi settimanali.** Si studia quando capita. Niente serie di giorni o settimane: per chi parte senza una struttura sono un blocco, non uno stimolo.
- **Struttura:** materia → unità → moduli. Un modulo è una lezione breve (15-20 minuti) più un **mini test** di 5 domande con correzione immediata e spiegazione, senza voto. Con 4 giuste su 5 il modulo è completato.
- **Verifica di unità:** 20 domande, 40 minuti, voto in decimi (minimo 2, arrotondato al mezzo voto). Si sblocca solo a moduli tutti completati, poi si fa quando si vuole. Con 6 l'unità è superata, con 8 padroneggiata. Durante la verifica nessuna correzione: si vede alla consegna.
- **Gamification che premia e non punisce:** punti, livelli, traguardi. Un'unità superata si **incrina** se non viene toccata per 21 giorni; ritentare la verifica la ripara. Regole e soglie in `lib/game.ts` (`RULES`).
- **Le unità non si bloccano tra loro:** solo la verifica è bloccata finché mancano moduli.
- **Storia** è la materia pilota. Le altre sono nel catalogo come "in preparazione".
- **Contenuti nel repo** (Markdown + JSON), non in un CMS: ogni nuova unità è una pull request revisionabile. Hygraph è stato considerato e scartato per ora.
- **Backend:** Supabase (auth + Postgres). Login con **link via email**, registrazioni chiuse (`shouldCreateUser: false`).
- **Layout:** app a schermo intero, barra fissa in alto, contenuto che scorre dentro (`.shell` / `.main`). Desktop prima, ma deve funzionare anche da telefono.
- I **PDF dei libri di testo** non vanno mai nel repo (copyright). Si usano solo come riferimento per allineare le unità; la cartella `materiali/` è in `.gitignore`.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, `@supabase/ssr`, `react-markdown`. Test con Jest e Testing Library. Hosting previsto: Vercel.

Next 16: il middleware si chiama **`proxy.ts`** (funzione `proxy`). `params` e `searchParams` sono Promise. La documentazione della versione installata è in `node_modules/next/dist/docs/`: consultala invece di andare a memoria.

## Comandi

```bash
npm run dev        # sviluppo, serve .env.local (vedi .env.example)
npm test           # Jest: logica di gioco, panoramica, validità dei contenuti, mini test
npm run typecheck
npm run lint
npm run build
```

Prima di proporre una modifica: `npm run typecheck && npm run lint && npm test`.

## Dove sta cosa

- `content/materie.json`: catalogo di materie e unità previste (`ready: true` solo per quelle scritte). L'ordine nel catalogo è l'ordine di studio.
- `content/<materia>/<unità>/unit.json` + un `.md` per lezione. Schema in `lib/types.ts`.
- `lib/game.ts`: regole, voti, livelli, stati di unità, traguardi. Funzioni pure, testate.
- `lib/overview.ts`: calcola stati, "riprendi da dove eri", unità da riparare. Pura, testata.
- `lib/actions.ts`: Server Actions. **La correzione si rifà sempre sul server**: il browser manda solo le risposte. Le soluzioni della verifica non arrivano mai al browser (`toPublic`).
- `lib/progress.ts`: legge lo stato dell'utente da Supabase, una volta per richiesta.
- `supabase/migrations/`: schema e RLS. Tre tabelle: `module_progress`, `test_attempts`, `points_events`.
- `app/(app)/`: pagine con la barra di navigazione. `app/(focus)/`: mini test e verifica, a tutto schermo senza menu.

## Chiavi nel database

Moduli e unità sono salvati come stringhe `materia/unità/modulo` e `materia/unità` (`lib/keys.ts`). **Non rinominare id di cartelle o moduli già pubblicati**: si perderebbe l'avanzamento. Per cambiare un titolo, cambia solo `title`.

## Scrivere una nuova unità

1. Aggiungi la cartella `content/<materia>/<id-unità>/` con `unit.json` e le lezioni `.md`, e metti `ready: true` nel catalogo. `number` deve essere la posizione nel catalogo.
2. Ogni modulo: lezione di 400-700 parole con titoletti `##`, grassetti sui termini chiave, un riquadro finale `> **In breve.**`. Niente tabelle (non c'è remark-gfm).
3. Ogni mini test: 5 domande sul solo contenuto di quella lezione. La verifica: 20 domande su tutta l'unità, ognuna con `topic` (il nome breve del modulo). Dalla seconda unità in poi, 3-4 domande della verifica sono di **ripasso** sulle unità precedenti, con `topic: "Ripasso"`.
4. 4 opzioni per domanda, una sola difendibile, distrattori plausibili ma chiaramente sbagliati. Varia la posizione della risposta giusta. Spiegazione breve che dice anche perché i distrattori sono sbagliati quando serve.
5. Ogni domanda deve avere risposta nel testo delle lezioni.
6. Fai verificare i fatti a un agente separato prima di aprire la PR: date, nomi, attribuzioni. Standard: un buon libro di testo italiano, semplificare va bene, sbagliare no.
7. `npm test` controlla forma e coerenza dei contenuti, non la correttezza dei fatti.

Lingua: italiano semplice e diretto, frasi brevi, seconda persona singolare nell'interfaccia. Il programma di riferimento per ora è quello ministeriale (linee guida degli istituti tecnici); quando arriva il programma della scuola scelta, le unità vanno riallineate a quello.

## Cose aperte

- Data dell'esame e scuola: non ancora decise. In `/andamento` c'è "data da confermare".
- Test finale di materia e simulazioni d'esame complete: previsti, non ancora fatti.
- Prove di orale e temi di italiano: si fanno in chat con Claude, non nel sito. Eventualmente in futuro si registra il voto a mano.
- Riferimento ai capitoli del libro nelle lezioni: arriva quando ci sono i PDF.
