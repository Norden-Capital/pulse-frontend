"use client"

import { useState } from "react"
import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api, ApiError, errorMessage } from "@/lib/api"
import { PASSWORD_MAX, PASSWORD_MIN, passwordProblem } from "@/lib/auth-types"
import { BIG, Field, Notice } from "@/components/auth/auth-ui"

/** "Password" card; the form opens in a dialog. This session stays; the backend signs out other devices. */
export function ChangePasswordCard() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          At least {PASSWORD_MIN} characters. When you change it, your other devices are signed out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {done && <Notice tone="success">Password changed. Your other devices are signed out.</Notice>}
        <Button
          variant="outline"
          className={BIG}
          onClick={() => {
            setDone(false)
            setOpen(true)
          }}
        >
          <KeyRound aria-hidden />
          Change password
        </Button>
      </CardContent>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>You stay signed in here. Your other devices are signed out.</DialogDescription>
          </DialogHeader>
          {/* Mounted only while open: typed passwords do not stay in memory after closing. */}
          {open && (
            <ChangePasswordForm
              onPending={setPending}
              onDone={() => {
                setOpen(false)
                setDone(true)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function ChangePasswordForm({ onPending, onDone }: { onPending: (pending: boolean) => void; onDone: () => void }) {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [repeat, setRepeat] = useState("")
  const [touched, setTouched] = useState(false)
  const [pending, setPending] = useState(false)
  const [currentError, setCurrentError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const problem = passwordProblem(next)
  const mismatch = repeat !== next

  function busy(value: boolean) {
    setPending(value)
    onPending(value)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(true)
    setError(null)
    setCurrentError(null)
    if (!current || problem || mismatch) return
    busy(true)
    try {
      await api("/me/password", { method: "POST", body: { currentPassword: current, newPassword: next } })
      busy(false)
      onDone()
    } catch (err) {
      busy(false)
      if (err instanceof ApiError && err.code === "invalid_current_password") setCurrentError(err.message)
      else setError(errorMessage(err))
    }
  }

  const currentMsg = currentError ?? (touched && !current ? "Enter your current password." : null)

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Notice tone="danger">{error}</Notice>}
      <Field
        id="current-password"
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        error={currentMsg}
      />
      <Field
        id="new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX}
        placeholder={`At least ${PASSWORD_MIN} characters`}
        value={next}
        onChange={(e) => setNext(e.target.value)}
        hint={`At least ${PASSWORD_MIN} characters.`}
        error={touched ? problem : undefined}
      />
      <Field
        id="repeat-password"
        label="Repeat new password"
        type="password"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX}
        value={repeat}
        onChange={(e) => setRepeat(e.target.value)}
        error={touched && mismatch ? "The passwords are not the same." : undefined}
      />
      <Button type="submit" className={BIG} disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  )
}
