"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { api, ApiError, errorMessage } from "@/lib/api"
import { PASSWORD_MAX, PASSWORD_MIN, passwordProblem } from "@/lib/auth-types"
import { rememberPendingEmail } from "@/components/auth/pending-email"
import { AuthHeader, BIG, Field, Notice } from "@/components/auth/auth-ui"

export function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
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
    if (!event.currentTarget.checkValidity() || problem || mismatch) return
    const address = email.trim()
    setPending(true)
    setError(null)
    try {
      // Always 202, whether or not the email already has an account.
      await api("/auth/register", { method: "POST", body: { email: address, password } })
      rememberPendingEmail(address)
      router.push("/register-done")
    } catch (err) {
      setPending(false)
      if (err instanceof ApiError && err.code === "validation_error") {
        setError("Please enter a valid email address.")
      } else {
        setError(errorMessage(err))
      }
    }
  }

  return (
    <div>
      <AuthHeader title="Create your account" subtitle="We send you an email to confirm your address." />
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          maxLength={320}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={touched && !email.trim() ? "Enter your email." : undefined}
        />
        <Field
          id="password"
          name="password"
          label="Password"
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
          name="repeat"
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
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
