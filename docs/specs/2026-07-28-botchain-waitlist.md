# Botchain Waitlist Specification

## Goal

Keep the existing Starknet application available on the `development` branch while `main` serves a single Agentis waitlist during the Botchain migration.

## User Experience

- Show one responsive page with Agentis branding, the Botchain migration message, and an email waitlist form.
- Do not expose wallet connection, marketplace, agent creation, chat, pricing, statistics, or other product actions.
- Redirect unknown browser routes to the waitlist.
- Provide clear idle, submitting, success, duplicate, validation, and service error states.
- Support keyboard navigation, visible focus, reduced motion, and readable mobile layouts.

## Submission Contract

`POST /api/waitlist` accepts an email address and a hidden bot-trap field. The endpoint normalizes and validates the email, then forwards it to `WAITLIST_WEBHOOK_URL`. An optional `WAITLIST_WEBHOOK_TOKEN` is sent as a bearer token.

The configured webhook is responsible for durable storage and duplicate detection. It should return `409` for an existing email and any `2xx` status for a new signup.

## Acceptance Criteria

- All previous public application pages and API routes are unavailable on `main`.
- A valid email can reach the configured webhook.
- Invalid input never reaches the webhook.
- The page passes ESLint and a production Next.js build.
- Desktop and mobile screenshots show no overflow or clipped content.
