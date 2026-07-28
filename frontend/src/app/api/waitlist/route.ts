import { NextResponse } from 'next/server'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type WaitlistRequest = {
  email?: unknown
  website?: unknown
}

export async function POST(request: Request) {
  let body: WaitlistRequest

  try {
    body = (await request.json()) as WaitlistRequest
  } catch {
    return NextResponse.json(
      { message: 'Enter a valid email address.' },
      { status: 400 },
    )
  }

  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ message: 'You are on the list.' }, { status: 201 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { message: 'Enter a valid email address.' },
      { status: 400 },
    )
  }

  const webhookUrl = process.env.WAITLIST_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json(
      { message: 'The waitlist is being configured. Please try again shortly.' },
      { status: 503 },
    )
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (process.env.WAITLIST_WEBHOOK_TOKEN) {
    headers.Authorization = `Bearer ${process.env.WAITLIST_WEBHOOK_TOKEN}`
  }

  let webhookResponse: Response

  try {
    webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        source: 'botchain-service-marketplace-waitlist',
        submittedAt: new Date().toISOString(),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return NextResponse.json(
      { message: 'The waitlist service is unavailable. Please try again shortly.' },
      { status: 502 },
    )
  }

  if (webhookResponse.status === 409) {
    return NextResponse.json(
      { message: 'You are already on the list.' },
      { status: 409 },
    )
  }

  if (!webhookResponse.ok) {
    return NextResponse.json(
      { message: 'We could not add you right now. Please try again.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ message: 'You are on the list.' }, { status: 201 })
}
