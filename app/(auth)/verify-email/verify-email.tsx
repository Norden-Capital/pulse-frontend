"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { api, ApiError, errorMessage } from "@/lib/api"
import type { TokenCheck } from "@/lib/auth-types"
import { AuthHeader, BIG, CenteredState, LinkButton, Notice } from "@/components/auth/auth-ui"

export function VerifyEmail({ token, check }: { token: string; check: TokenCheck }) {
  const [state, setState] = useState<"idle" | "pending" | "done" | "invalid">("idle")
  const [error, setError] = useState<string | null>(null)

  if (state === "invalid" || check.kind === "invalid") {
    return (
      <CenteredState
        title="This link does not work"
        text="It has expired or was already used. If your email is not confirmed yet, we can send you a new link."
      >
        <LinkButton href="/register-done" variant="default">
          Send a new link
        </LinkButton>
        <LinkButton href="/login">Go to sign in</LinkButton>
      </CenteredState>
    )
  }
  if (check.kind === "error") {
    return (
      <CenteredState title="Can't check this link right now" text="Please try again in a moment.">
        <LinkButton href="/login">Go to sign in</LinkButton>
      </CenteredState>
    )
  }
  if (state === "done") {
    return (
      <CenteredState title="Email confirmed" text="Your Pulse account is ready. Sign in to start.">
        <LinkButton href="/login?verified=1" variant="default">
          Sign in
        </LinkButton>
      </CenteredState>
    )
  }

  async function confirm() {
    setState("pending")
    setError(null)
    try {
      await api("/auth/verify-email", { method: "POST", body: { token } })
      setState("done")
    } catch (err) {
      if (err instanceof ApiError && err.code === "token_invalid") {
        setState("invalid")
      } else {
        setState("idle")
        setError(errorMessage(err))
      }
    }
  }

  return (
    <div>
      <AuthHeader
        title="Confirm your email"
        subtitle={
          <>
            For <strong className="break-all text-foreground">{check.info.email}</strong>.
          </>
        }
      />
      <div className="mt-8 space-y-4">
        {error && <Notice tone="danger">{error}</Notice>}
        <Button type="button" className={BIG} onClick={confirm} disabled={state === "pending"}>
          {state === "pending" ? "Confirming…" : "Confirm email"}
        </Button>
      </div>
    </div>
  )
}
