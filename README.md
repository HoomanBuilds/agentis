# IRAI Protocol

The `main` branch contains the IRAI Protocol waitlist frontend. The complete
product workspace is preserved on `development`.

## Local Development

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Waitlist Storage

Run the SQL migration in `frontend/supabase/migrations/`, then configure the
server-only Supabase variables documented in `frontend/.env.example`.

## Quality Checks

```bash
cd frontend
npm run lint
npm run build
```
