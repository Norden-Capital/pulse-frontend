"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { api, ApiError, errorMessage } from "@/lib/api"
import { PASSWORD_MAX, PASSWORD_MIN, passwordProblem, type TokenCheck, type TokenInfo } from "@/lib/auth-types"
import { AuthHeader, BIG, CenteredState, Field, LinkButton, Notice } from "@/components/auth/auth-ui"

export function SetPasswordForm({ token, check }: { token: string; check: TokenCheck }) {
  const [invalid, setInvalid] = useState(false)

  if (invalid || check.kind === "invalid") {
    return (
      <CenteredState title="This link does not work" text="It has expired or was already used. Reset links work for 1 hour.">
        <LinkButton href="/forgot-password" variant="default">
          Get a new reset link
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
  return <PasswordForm token={token} info={check.info} onInvalid={() => setInvalid(true)} />
}

function PasswordForm({ token, info, onInvalid }: { token: string; info: TokenInfo; onInvalid: () => void }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [repeat, setRepeat] = useState("")
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const problem = passwordProblem(password)
  const mismatch = repeat !== password

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(true)
    if (problem || mismatch) return
    setPending(true)
    setError(null)
    try {
      // Signs the account out everywhere; the user signs in again.
      await api("/auth/set-password", { method: "POST", body: { token, password } })
      router.replace("/login?password=set")
    } catch (err) {
      setPending(false)
      if (err instanceof ApiError && err.code === "token_invalid") onInvalid()
      else setError(errorMessage(err))
    }
  }

  return (
    <div>
      <AuthHeader
        title="Choose a new password"
        subtitle={
          <>
            For <strong className="break-all text-foreground">{info.email}</strong>. Your other devices are signed out.
          </>
        }
      />
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {error && <Notice tone="danger">{error}</Notice>}
        {/* Lets password managers save the right account. */}
        <input type="email" name="username" value={info.email} autoComplete="username" readOnly hidden />
        <Field
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder={`At least ${PASSWORD_MIN} characters`}
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`At least ${PASSWORD_MIN} characters.`}
          error={touched ? problem : undefined}
        />
        <Field
          id="repeat"
          label="Repeat the password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat the password"
          maxLength={PASSWORD_MAX}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          error={touched && mismatch ? "The passwords are not the same." : undefined}
        />
        <Button type="submit" className={BIG} disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </Button>
        <LinkButton href="/login">Back to sign in</LinkButton>
      </form>
    </div>
  )
}
