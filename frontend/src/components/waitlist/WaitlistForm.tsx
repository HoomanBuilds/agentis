'use client'

import { FormEvent, useState } from 'react'

type FormStatus = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error'

type WaitlistResponse = {
  message?: string
}

export function WaitlistForm() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [message, setMessage] = useState('')
  const emailId = 'waitlist-email'
  const websiteId = 'waitlist-website'
  const messageId = 'waitlist-message'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') ?? '').trim()
    const website = String(formData.get('website') ?? '')

    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    setStatus('submitting')
    setMessage('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, website }),
      })
      const data = (await response.json().catch(() => ({}))) as WaitlistResponse

      if (response.ok) {
        setStatus('success')
        return
      }

      if (response.status === 409) {
        setStatus('duplicate')
        return
      }

      setStatus('error')
      setMessage(data.message ?? 'We could not add you right now. Please try again.')
    } catch {
      setStatus('error')
      setMessage('The waitlist service is unavailable. Please try again shortly.')
    }
  }

  if (status === 'success' || status === 'duplicate') {
    return (
      <div className="waitlist-form-wrap">
        <div className="waitlist-confirmation" role="status" aria-live="polite">
          <span className="confirmation-mark" aria-hidden="true">✓</span>
          <div>
            <p className="confirmation-title">
              {status === 'success' ? 'You are on the list.' : 'You are already on the list.'}
            </p>
            <p className="confirmation-copy">
              We will send marketplace access and provider onboarding details.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="waitlist-form-wrap">
      <form className="waitlist-form" onSubmit={handleSubmit}>
        <label htmlFor={emailId} className="sr-only">
          Email address
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          required
          placeholder="you@example.com"
          className="waitlist-input"
          disabled={status === 'submitting'}
          aria-describedby={messageId}
          onInput={() => {
            if (status === 'error') {
              setStatus('idle')
              setMessage('')
            }
          }}
        />
        <div className="bot-field" aria-hidden="true">
          <label htmlFor={websiteId}>Website</label>
          <input
            id={websiteId}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="waitlist-button"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              Joining...
            </>
          ) : (
            'Join the waitlist'
          )}
        </button>
      </form>
      {status === 'error' ? (
        <p
          id={messageId}
          className="form-message form-message-error"
          role="alert"
        >
          {message}
        </p>
      ) : (
        <p id={messageId} className="form-note">
          Early access and launch updates only. No spam.
        </p>
      )}
    </div>
  )
}
