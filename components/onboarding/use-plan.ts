"use client"

// The plan for the current answers, from POST /api/onboarding/plan. The
// backend is the only place the numbers are calculated; this only asks and
// remembers the answer for the same answers (plan screen → account screen).

import { useEffect, useState } from "react"
import { api, errorMessage } from "@/lib/api"
import type { Plan, ProfileAnswers } from "@/lib/onboarding/types"

const cache = new Map<string, Plan>()

type State = { key: string; plan: Plan | null; error: string | null }

export function usePlan(answers: ProfileAnswers | null) {
  const key = answers ? JSON.stringify(answers) : ""
  const [state, setState] = useState<State>({ key: "", plan: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!key || cache.has(key)) return
    let live = true
    api<Plan>("/onboarding/plan", { method: "POST", body: JSON.parse(key) })
      .then((plan) => {
        cache.set(key, plan)
        if (live) setState({ key, plan, error: null })
      })
      .catch((err: unknown) => {
        if (live) setState({ key, plan: null, error: errorMessage(err) })
      })
    return () => {
      live = false
    }
  }, [key, attempt])

  const cached = cache.get(key) ?? null
  const current = state.key === key ? state : null
  return {
    plan: cached ?? current?.plan ?? null,
    error: cached ? null : (current?.error ?? null),
    retry: () => {
      setState({ key: "", plan: null, error: null })
      setAttempt((n) => n + 1)
    },
  }
}
