# Agentis

Agentis is rebuilding its AI agent economy on Botchain. While the migration is in progress, the `main` branch serves a focused waitlist experience. The previous Starknet application is preserved on the `development` branch.

## Local Development

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Waitlist Delivery

The page submits email addresses to `POST /api/waitlist`. Configure `WAITLIST_WEBHOOK_URL` in `frontend/.env.local` with an HTTPS endpoint that stores signups. Set `WAITLIST_WEBHOOK_TOKEN` when the endpoint expects a bearer token.

The webhook receives:

```json
{
  "email": "person@example.com",
  "source": "agentis-botchain-waitlist",
  "submittedAt": "2026-07-28T00:00:00.000Z"
}
```

Return any `2xx` response for a new signup or `409` when the email already exists. The application validates and normalizes email addresses before delivery and includes a hidden bot-trap field.

## Quality Checks

Run from `frontend/`:

```bash
npm run lint
npm run build
```

The active UI is in `src/app/page.tsx`, the form is in `src/components/waitlist/WaitlistForm.tsx`, and the submission endpoint is in `src/app/api/waitlist/route.ts`.
