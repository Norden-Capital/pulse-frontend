"use client"

// "Save your plan" (mockup 13): create the account, sending the answers (and a
// manual override, if any) with the register request (contract §2). The server
// recalculates the plan itself; register answers 202 in every case.

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api, ApiError, errorMessage } from "@/lib/api"
import { PASSWORD_MAX, PASSWORD_MIN, passwordProblem } from "@/lib/auth-types"
import { rememberPendingEmail } from "@/components/auth/pending-email"
import { Field, Notice } from "@/components/auth/auth-ui"
import { PulseLogo } from "@/components/brand/pulse-logo"
import { Footer, PILL_PRIMARY, TopBar } from "./onboarding-ui"
import { SourceBadge, fmt } from "./plan-parts"
import { shownTargets, usePlanForDraft } from "./plan-screen"
import { markPlanSaved } from "./use-draft"

export function AccountScreen() {
  const router = useRouter()
  const { draft, answers, plan } = usePlanForDraft()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeat, setRepeat] = useState("")
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const problem = passwordProblem(password)
  const mismatch = repeat !== password
  const shown = plan ? shownTargets(draft, plan) : null

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(true)
    if (!answers || !event.currentTarget.checkValidity() || problem || mismatch) return
    const address = email.trim()
    setPending(true)
    setError(null)
    try {
      // Always 202, whether or not the email already has an account.
      await api("/auth/register", {
        method: "POST",
        body: {
          email: address,
          password,
          profile: draft.targets ? { answers, targets: draft.targets } : { answers },
        },
      })
      rememberPendingEmail(address)
      markPlanSaved()
      // The answers are cleared on "Check your inbox" (clearing here would
      // send this page back to the first question before it leaves).
      router.push("/register-done")
    } catch (err) {
      setPending(false)
      if (err instanceof ApiError && err.code === "validation_error") {
        setError("Please check your email address. If it looks right, go back and check your answers.")
      } else {
        setError(errorMessage(err))
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col px-(--sp-gutter) pt-2">
      <TopBar back="/start/plan" />
      <header className="mt-1 flex flex-col items-center text-center">
        <PulseLogo />
        <h1 className="mt-7 text-[1.8125rem] leading-tight font-medium">Save your plan</h1>
        <p className="mt-2 text-[0.8125rem] leading-snug text-(--sp-text-muted)">
          Create an account to keep your plan and start logging.
        </p>
      </header>

      <div className="mt-[22px] rounded-[18px] bg-(--sp-panel) px-4 py-3.5">
        <div className="flex items-center justify-between text-[13px] text-(--sp-text-muted)">
          <span>Your plan</span>
          {shown && <SourceBadge small manual={shown.manual} />}
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <b className="text-xl font-semibold tabular-nums">
            {shown ? fmt(shown.targets.calories) : "–"}{" "}
            <span className="text-[13px] font-medium text-(--sp-text-muted)">kcal / day</span>
          </b>
          {shown && (
            <span className="text-xs text-(--sp-text-muted) tabular-nums">
              P {shown.targets.proteinG} · C {shown.targets.carbsG} · F {shown.targets.fatG} g
            </span>
          )}
        </div>
      </div>

      <form id="account" onSubmit={onSubmit} className="mt-[22px] space-y-4" noValidate>
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
      </form>

      <Footer className="gap-1.5">
        <button type="submit" form="account" className={PILL_PRIMARY} disabled={pending || !answers}>
          {pending ? "Creating account…" : "Create account"}
        </button>
        <p className="pt-1.5 pb-0.5 text-center text-sm text-(--sp-text-muted)">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-(--sp-text) underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </Footer>
    </div>
  )
}
