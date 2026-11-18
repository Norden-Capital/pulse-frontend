"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { api, errorMessage } from "@/lib/api"
import { readPendingEmail } from "@/components/auth/pending-email"
import { AuthHeader, BIG, Field, LinkButton, Notice } from "@/components/auth/auth-ui"
import { CheckIcon, MailIcon } from "@/components/onboarding/icons"
import { clearDraft, readPlanSaved } from "@/components/onboarding/use-draft"

const noSubscribe = () => () => {}

/**
 * "Check your inbox" after register, with "Resend email". Also reached from
 * an expired verify link: then the email is not known and is asked for.
 */
export function RegisterDone() {
  // sessionStorage exists only in the browser; the server renders "unknown".
  const remembered = useSyncExternalStore(noSubscribe, readPendingEmail, () => null)
  // Came from "Save your plan": the plan went with the register request.
  const planSaved = useSyncExternalStore(noSubscribe, readPlanSaved, () => false)
  // The answers are on the server now; forget this tab's copy (health data).
  useEffect(() => {
    if (planSaved) clearDraft()
  }, [planSaved])
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
    <div className="flex flex-1 flex-col justify-center">
      <AuthHeader
        icon={<MailIcon />}
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
      {planSaved && (
        <div className="mt-7 flex gap-2.5 rounded-2xl bg-(--sp-panel) px-3.5 py-3 text-xs leading-normal text-(--sp-text-2)">
          <span className="mt-px shrink-0">
            <CheckIcon />
          </span>
          <span>Your plan is saved. It is waiting for you after you sign in.</span>
        </div>
      )}
      <form onSubmit={resend} className="mt-4 space-y-4">
        {error && <Notice tone="danger">{error}</Notice>}
        {state === "sent" && (
          <Notice tone="success">If this email is waiting for confirmation, a new link is on its way.</Notice>
        )}
        <p className="text-sm leading-normal text-muted-foreground">
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
        <Button type="submit" variant="secondary" className={BIG} disabled={state === "sending" || !email}>
          {state === "sending" ? "Sending…" : "Resend email"}
        </Button>
        <LinkButton href="/login" variant="default">
          Go to sign in
        </LinkButton>
      </form>
    </div>
  )
}
