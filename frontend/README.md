# Botchain Waitlist Frontend

Next.js 16 frontend for the three-section AI services marketplace waitlist.

## Development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Waitlist Configuration

Set `WAITLIST_WEBHOOK_URL` to the HTTPS endpoint that stores signup emails. Set `WAITLIST_WEBHOOK_TOKEN` when the endpoint expects a bearer token.

The webhook receives:

```json
{
  "email": "person@example.com",
  "source": "botchain-service-marketplace-waitlist",
  "submittedAt": "2026-07-28T00:00:00.000Z"
}
```

Return any `2xx` response for a new signup or `409` for an existing email.

## Validation

```bash
npm run lint
npm run build
```

The landing page is in `src/app/page.tsx`, the form is in `src/components/waitlist/WaitlistForm.tsx`, and the endpoint is in `src/app/api/waitlist/route.ts`.
