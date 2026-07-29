# IRAI Protocol Waitlist

Next.js 16 frontend for the IRAI Protocol services marketplace waitlist.

## Development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Waitlist Configuration

Create a Supabase project and run the migration in
`supabase/migrations/20260729153000_create_waitlist_entries.sql`.

Set these server-only environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_server_key
```

The Vercel Supabase integration supplies both values automatically. The API
normalizes emails, rejects invalid input, and relies on the database constraint
to prevent duplicate signups. The secret key remains server-only.

## Validation

```bash
npm run lint
npm run build
```

The landing page is in `src/app/page.tsx`, the form is in `src/components/waitlist/WaitlistForm.tsx`, and the endpoint is in `src/app/api/waitlist/route.ts`.
