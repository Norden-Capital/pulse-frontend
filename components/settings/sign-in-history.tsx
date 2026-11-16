"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import type { SignInDay } from "@/lib/auth-types"
import { browserZone, signInsQuery, summarizeSignIns } from "@/lib/sign-ins"
import { DayLabel } from "./local-date"

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; days: SignInDay[] }

/**
 * Sign-ins of the last 6 months, per day. Loaded in the browser because the
 * days are cut in the browser's own time zone (`?zone=`); Pulse has no saved
 * time-zone preference yet.
 */
export function SignInHistory() {
  const [state, setState] = useState<State>({ kind: "loading" })

  useEffect(() => {
    let alive = true
    api<SignInDay[]>(`/me/sign-ins${signInsQuery(browserZone())}`)
      .then((days) => alive && setState({ kind: "ready", days: days ?? [] }))
      .catch(() => alive && setState({ kind: "error" }))
    return () => {
      alive = false
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign-in history</CardTitle>
        <CardDescription>Last 6 months, password and Face ID.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.kind === "loading" ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" aria-label="Loading sign-ins" />
        ) : state.kind === "error" ? (
          <p className="rounded-lg bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
            Sign-ins could not be loaded. Please try again later.
          </p>
        ) : (
          <History days={state.days} />
        )}
      </CardContent>
    </Card>
  )
}

function History({ days }: { days: SignInDay[] }) {
  const { ok, failed, recent } = summarizeSignIns(days)
  if (recent.length === 0) {
    return <p className="rounded-lg bg-muted px-4 py-3 text-center text-sm text-muted-foreground">No sign-ins yet.</p>
  }
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted px-4 py-3">
          <dt className="text-xs text-muted-foreground">Successful</dt>
          <dd className="text-2xl font-semibold tabular-nums">{ok}</dd>
        </div>
        <div className="rounded-lg bg-muted px-4 py-3">
          <dt className="text-xs text-muted-foreground">Failed</dt>
          <dd className={`text-2xl font-semibold tabular-nums ${failed > 0 ? "text-destructive" : ""}`}>{failed}</dd>
        </div>
      </dl>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Recent days</p>
        <ul className="divide-y">
          {recent.map((d) => (
            <li key={d.date} className="flex min-h-11 items-center justify-between gap-3 text-sm">
              <DayLabel day={d.date} />
              <span className="tabular-nums text-muted-foreground">
                {d.ok} ok
                {d.failed > 0 && <span className="text-destructive"> · {d.failed} failed</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">Don&apos;t recognise a failed sign-in? Change your password.</p>
    </div>
  )
}
