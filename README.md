# Banco

Preparazione all'esame di idoneità del primo biennio, un modulo alla volta: lezioni brevi, un mini test alla fine di ognuna, verifica di unità quando hai finito i moduli. Punti, livelli e traguardi, senza calendari da rispettare.

## Setup

### 1. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Applica la migrazione in `supabase/migrations/`: incollala nel SQL Editor, oppure con la CLI:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
3. **Authentication → Sign In / Providers → Email**: lascia attivo Email, disattiva *Allow new users to sign up*.
4. **Authentication → Users → Add user**: crea il tuo utente con la tua email. Le registrazioni sono chiuse, quindi entra solo chi crei qui.
5. **Authentication → URL Configuration**: imposta *Site URL* sull'indirizzo del sito e aggiungi `http://localhost:3000/**` e `https://<tuo-dominio>/**` tra i *Redirect URLs*.
6. **Consigliato, Authentication → Emails → Magic Link**: cambia il link del template in
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```
   Così il link funziona anche se lo apri da un altro browser o dal telefono. Con il template di default funziona solo nello stesso browser da cui l'hai chiesto.

### 2. In locale

```bash
cp .env.example .env.local   # e riempi URL e anon key da Project Settings → API
npm install
npm run dev
```

### 3. Vercel

Importa il repo, aggiungi le tre variabili di `.env.example` (con `NEXT_PUBLIC_SITE_URL` sul dominio Vercel) e fai il deploy.

## Sviluppo

```bash
npm test            # logica di gioco, panoramica, validità dei contenuti, mini test
npm run typecheck
npm run lint
npm run build
```

I contenuti sono in `content/`. Come scrivere una nuova unità e le decisioni di progetto sono in `CLAUDE.md`.
