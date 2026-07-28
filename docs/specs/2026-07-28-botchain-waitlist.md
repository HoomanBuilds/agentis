# Botchain Waitlist Specification

## Goal

Serve a focused early-access website for a Botchain AI services marketplace. The public identity remains name-neutral until the permanent product name is selected.

## Experience

- Use exactly three sections: brand hero, marketplace explanation, and final signup with footer.
- Reuse the supplied Nexus frontend's pixel typography, green ASCII canvas animation, terminal styling, grid texture, and compact card treatment.
- Follow the Dike reference's sparse pacing and near-full-screen section proportions.
- Keep the hero free of statistics, forms, and actions.
- Make joining the waitlist the only available product action, shown only in the final section.
- Use the official Botchain wordmark without modifying the source asset.
- Describe a marketplace where providers offer AI services, establish reputation, deliver work, and receive payment.
- Do not mention a migration, a previous network, or any rejected product name.

## Submission Contract

`POST /api/waitlist` accepts an email address and a hidden bot-trap field. The endpoint normalizes and validates the email, then forwards it to `WAITLIST_WEBHOOK_URL`. When set, `WAITLIST_WEBHOOK_TOKEN` is sent as a bearer token.

The webhook owns durable storage and duplicate detection. It should return `409` for an existing email and any `2xx` response for a new signup.

## Quality Requirements

- Provide idle, submitting, success, duplicate, validation, and service error states.
- Maintain visible keyboard focus, semantic labels, and an effective reduced-motion mode.
- Avoid horizontal overflow at 390px, 768px, 1024px, and 1440px widths.
- Redirect unknown browser routes to the waitlist and reject unknown API routes.
- Pass ESLint and the production Next.js build.
