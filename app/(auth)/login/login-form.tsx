"use client"

import { useState } from "react"
import Link from "next/link"
import { ScanFace } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, ApiError, errorMessage } from "@/lib/api"
import { usePasskeyLogin } from "@/components/auth/use-passkey-login"
import { AuthHeader, BIG, Field, Notice, OrDivider } from "@/components/auth/auth-ui"

type Unverified = { email: string; resend: "idle" | "sending" | "sent" | "failed" }

export function LoginForm({ next, notice }: { next: string; notice: "password-set" | "verified" | null }) {
  const [error, setError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState<Unverified | null>(null)
  const [pending, setPending] = useState(false)

  /** Same end for password and passkey sign-in. Full page load, so the server guards see the new session. */
  function finishLogin() {
    window.location.assign(next)
  }

  const passkey = usePasskeyLogin({
    onSuccess: finishLogin,
    onError: (text) => {
      setUnverified(null)
      setError(text)
    },
  })

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email")).trim()
    setPending(true)
    setError(null)
    setUnverified(null)
    try {
      // Never race the passkey options request (its answer would undo the sign-in).
      await passkey.waitIdle()
      await api("/auth/login", { method: "POST", body: { email, password: String(form.get("password")) } })
      finishLogin()
    } catch (err) {
      setPending(false)
      // Right password, but the email is not confirmed yet: offer a new link.
      if (err instanceof ApiError && err.code === "email_not_verified") {
        setUnverified({ email, resend: "idle" })
      } else {
        setError(errorMessage(err))
      }
    }
  }

  async function resend() {
    if (!unverified) return
    setUnverified({ ...unverified, resend: "sending" })
    try {
      await api("/auth/resend-verification", { method: "POST", body: { email: unverified.email } })
      setUnverified({ ...unverified, resend: "sent" })
    } catch {
      setUnverified({ ...unverified, resend: "failed" })
    }
  }

  return (
    <div>
      <AuthHeader title="Welcome back" subtitle="Sign in to Pulse." />
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {!error && !unverified && notice === "password-set" && (
          <Notice tone="success">Your password is set. You can sign in now.</Notice>
        )}
        {!error && !unverified && notice === "verified" && (
          <Notice tone="success">Your email is confirmed. You can sign in now.</Notice>
        )}
        {error && <Notice tone="danger">{error}</Notice>}
        {unverified && (
          <Notice tone="info" className="space-y-3">
            <p>
              Please confirm your email first. We sent a link to <strong className="break-all">{unverified.email}</strong>.
            </p>
            {unverified.resend === "sent" ? (
              <p className="text-muted-foreground">A new link is on its way. Check your inbox and spam folder.</p>
            ) : (
              <>
                {unverified.resend === "failed" && (
                  <p className="text-destructive">Could not send the email. Please try again.</p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className={BIG}
                  onClick={resend}
                  disabled={unverified.resend === "sending"}
                >
                  {unverified.resend === "sending" ? "Sending…" : "Resend email"}
                </Button>
              </>
            )}
          </Notice>
        )}
        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          // "webauthn": the phone can offer a passkey right here.
          autoComplete="username webauthn"
          inputMode="email"
          placeholder="you@example.com"
          required
        />
        <Field
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
          aside={
            <Link
              href="/forgot-password"
              className="-my-3 inline-flex h-11 items-center px-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" className={BIG} disabled={pending || passkey.pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        {passkey.supported && (
          <>
            <OrDivider />
            <Button
              type="button"
              variant="secondary"
              className={BIG}
              onClick={() => {
                setError(null)
                setUnverified(null)
                void passkey.start()
              }}
              disabled={!passkey.ready || passkey.pending || pending}
            >
              <ScanFace aria-hidden />
              {passkey.pending ? "Waiting for Face ID…" : "Sign in with Face ID"}
            </Button>
          </>
        )}
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Pulse?{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
