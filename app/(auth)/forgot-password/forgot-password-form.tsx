"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { api, errorMessage } from "@/lib/api"
import { AuthHeader, BIG, Field, LinkButton, Notice } from "@/components/auth/auth-ui"

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email: String(form.get("email")).trim() } })
      setSent(true)
    } catch (err) {
      // The backend always answers 202, so an error here is a real failure
      // (network, server down). Never say whether the email exists.
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <AuthHeader title="Forgot your password?" subtitle="We email you a link to choose a new one." />
      {sent ? (
        <div className="mt-8 space-y-4">
          <Notice tone="success">
            If this email has a Pulse account, we sent a link to it. Check your inbox. The link works for 1 hour.
          </Notice>
          <LinkButton href="/login">Back to sign in</LinkButton>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error && <Notice tone="danger">{error}</Notice>}
          <Field
            id="email"
            name="email"
            label="Email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="you@example.com"
            required
          />
          <Button type="submit" className={BIG} disabled={pending}>
            {pending ? "Sending…" : "Send link"}
          </Button>
          <LinkButton href="/login">Back to sign in</LinkButton>
        </form>
      )}
    </div>
  )
}
