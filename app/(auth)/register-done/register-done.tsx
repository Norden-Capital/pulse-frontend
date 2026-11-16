"use client"

import { useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { api, errorMessage } from "@/lib/api"
import { readPendingEmail } from "@/components/auth/pending-email"
import { AuthHeader, BIG, Field, LinkButton, Notice } from "@/components/auth/auth-ui"

const noSubscribe = () => () => {}

/**
 * "Check your inbox" after register, with "Resend email". Also reached from
 * an expired verify link: then the email is not known and is asked for.
 */
export function RegisterDone() {
  // sessionStorage exists only in the browser; the server renders "unknown".
  const remembered = useSyncExternalStore(noSubscribe, readPendingEmail, () => null)
  const [typed, setTyped] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")
  const [error, setError] = useState<string | null>(null)

  const email = remembered ?? typed.trim()

  async function resend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email) return
    setState("sending")
    setError(null)
    try {
      // Always 202: it never says whether the email has an account.
      await api("/auth/resend-verification", { method: "POST", body: { email } })
      setState("sent")
    } catch (err) {
      setState("idle")
      setError(errorMessage(err))
    }
  }

  return (
    <div>
      <AuthHeader
        title="Check your inbox"
        subtitle={
          remembered ? (
            <>
              We sent a link to <strong className="break-all text-foreground">{remembered}</strong>. Open it to confirm
              your email, then sign in.
            </>
          ) : (
            "Open the link in our email to confirm your address, then sign in."
          )
        }
      />
      <form onSubmit={resend} className="mt-8 space-y-4">
        {error && <Notice tone="danger">{error}</Notice>}
        {state === "sent" && (
          <Notice tone="success">If this email is waiting for confirmation, a new link is on its way.</Notice>
        )}
        <p className="text-sm text-muted-foreground">
          No email after a few minutes? Check your spam folder, or send it again. The link works for 1 day.
        </p>
        {!remembered && (
          <Field
            id="email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            required
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        )}
        <Button type="submit" variant="outline" className={BIG} disabled={state === "sending" || !email}>
          {state === "sending" ? "Sending…" : "Resend email"}
        </Button>
        <LinkButton href="/login" variant="default">
          Go to sign in
        </LinkButton>
      </form>
    </div>
  )
}
